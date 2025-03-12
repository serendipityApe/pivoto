export {}

const browserAction =
  process.env.PLASMO_BROWSER === "firefox"
    ? browser.action || browser.browserAction
    : chrome.action
const browserInstance =
  process.env.PLASMO_BROWSER === "firefox" ? browser : chrome
type Modify<T, R> = Omit<T, keyof R> & R
export type Action = Modify<
  Partial<chrome.tabs.Tab>,
  {
    type?: string
    emoji?: boolean
    emojiChar?: string
    action?: string
    keycheck?: boolean
    desc?: string
    domain?: string
    id?: string | number
    keys?: string[]
    groupTitle?: string
    groupColor?: string
    lastActiveTime?: number
  }
>

let actions: Action[] = []
let newtaburl = ""
const extensionId = browserInstance.runtime.id
const storage = browserInstance.storage.local
type TabHistoryItem = {
  id: number
  windowId: number
  index: number
  lastActiveTime: number
}
let tabHistory: TabHistoryItem[] = []

const isChrome121OrAbove = (() => {
  try {
    const userAgent = navigator.userAgent
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/)
    if (chromeMatch && process.env.PLASMO_BROWSER !== "firefox") {
      const version = parseInt(chromeMatch[1], 10)
      return version >= 121
    }
    return false
  } catch (e) {
    return false
  }
})()

/** 
	@param	
	@return: null | typeof tabHistory[number]
*/
function getPreActiveTab() {
  // 如果是Chrome 121+，使用原生API获取最近访问的标签页
  if (isChrome121OrAbove) {
    return new Promise((resolve) => {
      browserInstance.tabs.query({}, (tabs) => {
        // 按lastAccessed降序排序，获取当前标签页之外的最近访问标签页
        const sortedTabs = tabs.sort(
          (a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)
        )

        // 获取当前标签页
        browserInstance.tabs.query(
          { active: true, currentWindow: true },
          ([currentTab]) => {
            // 找到第一个不是当前标签页的标签
            const preActiveTab = sortedTabs.find(
              (tab) => tab.id !== currentTab.id
            )
            resolve(preActiveTab || null)
          }
        )
      })
    })
  }

  // 使用原有的tabHistory逻辑
  let l = tabHistory.length
  if (l < 2) return null
  let preActiveTab = tabHistory[l - 2]
  return preActiveTab
}

// 修改为支持异步的函数
async function getPreActiveTabAsync(): Promise<TabHistoryItem> {
  return (await getPreActiveTab()) as TabHistoryItem
}
function generateHistoryTab(tab, override = {}): TabHistoryItem {
  let { id, windowId, index } = tab
  let lastActiveTime = Date.now()
  return { id, windowId, index, lastActiveTime, ...override }
}

function getFavicon(domain) {
  return `http://www.google.com/s2/favicons?domain=${domain}`
}

function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}
if (!isChrome121OrAbove) {
  browserInstance.windows.onFocusChanged.addListener(function (windowId) {
    if (windowId === -1) return
    if (tabHistory[tabHistory.length - 1]?.windowId !== windowId) {
      let targetTab = null
      const index = tabHistory.findLastIndex((item) => {
        if (item.windowId === windowId) {
          targetTab = item
          return true
        }
      })
      if (index !== -1) {
        tabHistory.splice(index, 1)
        tabHistory.push({ ...targetTab, lastActiveTime: Date.now() })
      }
    }
    handleBatch(resetPivoto)
  })
  browserInstance.windows.onRemoved.addListener(function (windowId) {
    // Handle the window close event here
    tabHistory = tabHistory.filter((tab) => tab.windowId != windowId)
  })
  browserInstance.tabs.onActivated.addListener(async function (activeInfo) {
    handleBatch(resetPivoto)
  })
  browserInstance.tabs.onRemoved.addListener(
    function tabRemoveHandler(tabId, removeInfo) {
      const { windowId } = removeInfo
      const index = tabHistory.findIndex((item) => item.id === tabId)
      if (index !== -1) {
        tabHistory.splice(index, 1)
      }
      handleBatch(resetPivoto)
    }
  )
} else {
  browserInstance.tabs.onActivated.addListener(async function () {
    handleBatch(resetPivoto)
  })
  browserInstance.windows.onFocusChanged.addListener(function (windowId) {
    if (windowId === -1) return
    handleBatch(resetPivoto)
  })
  browserInstance.tabs.onRemoved.addListener(function tabRemoveHandler() {
    handleBatch(resetPivoto)
  })
}

// Clear actions and append default ones
const clearActions = async () => {
  // let result = await storage.get(["disabledActions"])
  // const disabledActions = result?.disabledActions
  const disabledActions = true

  getCurrentTab().then((response) => {
    actions = []
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
    let muteaction = {
      title: "Mute tab",
      desc: "Mute the current tab",
      type: "action",
      action: "mute",
      emoji: true,
      emojiChar: "🔇",
      keycheck: true,
      keys: ["⌥", "⇧", "M"]
    }
    let pinaction = {
      title: "Pin tab",
      desc: "Pin the current tab",
      type: "action",
      action: "pin",
      emoji: true,
      emojiChar: "📌",
      keycheck: true,
      keys: ["⌥", "⇧", "P"]
    }
    if (response?.mutedInfo.muted) {
      muteaction = {
        title: "Unmute tab",
        desc: "Unmute the current tab",
        type: "action",
        action: "unmute",
        emoji: true,
        emojiChar: "🔈",
        keycheck: true,
        keys: ["⌥", "⇧", "M"]
      }
    }
    if (response?.pinned) {
      pinaction = {
        title: "Unpin tab",
        desc: "Unpin the current tab",
        type: "action",
        action: "unpin",
        emoji: true,
        emojiChar: "📌",
        keycheck: true,
        keys: ["⌥", "⇧", "P"]
      }
    }
    actions = disabledActions ? [] : []

    if (!isMac) {
      for (let action of actions) {
        switch (action.action) {
          case "reload":
            action.keys = ["F5"]
            break
          case "fullscreen":
            action.keys = ["F11"]
            break
          case "downloads":
            action.keys = ["Ctrl", "J"]
            break
          case "settings":
            action.keycheck = false
            break
          case "history":
            action.keys = ["Ctrl", "H"]
            break
          case "go-back":
            action.keys = ["Alt", "←"]
            break
          case "go-forward":
            action.keys = ["Alt", "→"]
            break
          case "scroll-top":
            action.keys = ["Home"]
            break
          case "scroll-bottom":
            action.keys = ["End"]
            break
        }
        for (const key in action.keys) {
          if (action.keys[key] === "⌘") {
            action.keys[key] = "Ctrl"
          } else if (action.keys[key] === "⌥") {
            action.keys[key] = "Alt"
          }
        }
      }
    }
  })
}

// Open on install
browserInstance.runtime.onInstalled.addListener((object) => {
  // console.log('*****: installed')

  // Inject Pivoto on install
  const manifest = browserInstance.runtime.getManifest()

  const injectIntoTab = (tab) => {
    const scripts = manifest.content_scripts[0].js
    const s = scripts.length

    for (let i = 0; i < s; i++) {
      browserInstance.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scripts[i]]
      })
    }

    browserInstance.scripting.insertCSS({
      target: { tabId: tab.id },
      files: [manifest.content_scripts[0].css[0]]
    })
  }

  // Get all windows
  browserInstance.windows.getAll(
    {
      populate: true
    },
    (windows) => {
      let now = Date.now()
      let currentWindow
      const w = windows.length

      for (let i = 0; i < w; i++) {
        currentWindow = windows[i]

        let currentTab
        const t = currentWindow.tabs.length

        for (let j = 0; j < t; j++) {
          currentTab = currentWindow.tabs[j]
          if (
            !currentTab.url.includes("chrome://") &&
            !currentTab.url.includes("chrome-extension://") &&
            !currentTab.url.includes("browserInstance.google.com")
          ) {
            injectIntoTab(currentTab)
            // let cIndex = indexMap.get(currentTab.windowId) || 0;
            tabHistory.push(
              generateHistoryTab(currentTab, { lastActiveTime: now })
            )
          }
        }
      }
    }
  )

  if (object.reason === "install") {
    browserInstance.tabs.create({
      url: "https://github.com/serendipityApe/pivoto"
    })
    // Define default configuration
    // const defaultConfig = {
    //   specialSearch: [
    //     {
    //       id: "default",
    //       description: "Search in chrome",
    //       url: "https://www.google.com/chrome/"
    //     }
    //   ]
    // }

    // // Set default configuration in storage
    // chrome.storage.local.set(defaultConfig, () => {
    //   if (chrome.runtime.lastError) {
    //     console.error(
    //       "Error setting default storage:",
    //       chrome.runtime.lastError
    //     )
    //   } else {
    //     console.log("Default storage set successfully.")
    //   }
    // })
  }
})

// Check when the extension button is clicked
browserAction.onClicked.addListener(() => {
  browserInstance.tabs.create({
    url: `chrome-extension://${extensionId}/options.html`
  })
})

// Listen for the shortcut
browserInstance.commands.onCommand.addListener(async (command) => {
  //alt+shift+k
  if (command === "open-pivoto") {
    getCurrentTab().then((response) => {
      if (
        !response.url.includes("chrome://") &&
        !response.url.includes("chrome.google.com")
      ) {
        browserInstance.tabs.sendMessage(response.id, {
          request: "open-pivoto"
        })
      } else {
        browserInstance.tabs
          .create({
            url: "./tabs/blocktab.html"
          })
          .then(() => {
            newtaburl = response.url
            browserInstance.tabs.remove(response.id)
          })
      }
    })
  }
  if (command === "cycle-tab") {
    let preActiveTab = await getPreActiveTabAsync()
    if (!preActiveTab) return
    let currentTab = await getCurrentTab()
    try {
      //wether call switchTab directly
      if (
        !currentTab.url.includes("chrome://") &&
        !currentTab.url.includes("chrome.google.com")
      ) {
        browserInstance.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            func: () => document.activeElement.tagName.toLowerCase()
          },
          function (InjectionResult) {
            const result = InjectionResult?.[0]?.result
            if (result === "iframe") {
              switchTab(preActiveTab)
            } else if (result) {
              browserInstance.tabs.sendMessage(currentTab.id, {
                request: "cycle-tab"
              })
            }
          }
        )
      } else {
        switchTab(preActiveTab)
      }
    } catch {
      switchTab(preActiveTab)
    }
  }
})

// Get the current tab
const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true }
  const [tab] = await browserInstance.tabs.query(queryOptions)
  return tab
}

// Restore the new tab page (workaround to show Pivoto in new tab page)
function restoreNewTab() {
  getCurrentTab().then((response) => {
    browserInstance.tabs
      .create({
        url: newtaburl
      })
      .then(() => {
        browserInstance.tabs.remove(response.id)
      })
  })
}

const resetPivoto = async () => {
  console.log("resetPivoto")

  await clearActions()
  await getTabs()
  //   getBookmarks()
}
let timer = false
// 批处理
const handleBatch = (fn, time = 500) => {
  if (!timer) {
    timer = true
    setTimeout(() => {
      timer = false
      fn()
    }, time)
  }
}
// Check if tabs have changed and actions need to be fetched again
browserInstance.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  handleBatch(resetPivoto)
})
browserInstance.tabs.onCreated.addListener((tab) => handleBatch(resetPivoto))
// browserInstance.tabs.onRemoved.addListener((tabId, changeInfo) => handleBatch(resetPivoto));
// browserInstance.tabs.onActiveChanged.addListener((tab) => {

// })

// browserInstance.tabs.onActivated.addListener(async () => {
// 	if(lastActiveTab?.id !== currentTab?.id) lastActiveTab = currentTab;
// 	currentTab = await getCurrentTab();

// 	handleBatch(resetPivoto);
// })

// Get tabs to populate in the actions
const getTabs = async () => {
  let currentTab = await getCurrentTab()
  let groups = chrome && (await chrome.tabGroups.query({}))

  function injectTab(tab, deep = true, obj = {}) {
    let url = tab?.url
    const domain = url ? new URL(url)?.hostname : null

    let _obj: Partial<Action> = {
      desc: "Chrome tab",
      keycheck: false,
      action: "switch-tab",
      type: "tab",
      domain: domain,
      ...obj
    }
    if (groups.length && tab?.groupId != "-1") {
      let group = groups.find((group) => group.id === tab?.groupId)
      if (group) {
        _obj.groupTitle = group.title
        _obj.groupColor = group.color
      }
    }
    if (deep) {
      return Object.assign(tab, _obj)
    } else {
      return { ...tab, ..._obj }
    }
  }

  let tabs = (await browserInstance.tabs.query({})) as chrome.tabs.Tab[]

  if (isChrome121OrAbove) {
    // 使用原生lastAccessed属性
    tabs = tabs.filter((tab) => tab.id !== currentTab.id)
    tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))

    // 获取前一个活跃标签
    const preActiveTab = tabs[0]

    // 处理其他标签
    tabs = tabs.slice(1).map((tab) => injectTab(tab))

    // 如果有前一个活跃标签，添加到列表开头
    if (preActiveTab) {
      tabs.unshift(injectTab(preActiveTab, false, { desc: "Chrome tab" }))
    }
  } else {
    // 使用原有的tabHistory逻辑
    tabs.map((tab) => {
      let tabH = tabHistory.find((tabH) => tab.id == tabH.id)
      if (!tabH) {
        tabHistory.unshift(generateHistoryTab(tab))
      } else {
        tabH.index = tab.index
      }
    })
    const currentIndex = tabHistory.findIndex((item) => {
      if (item.id === currentTab?.id) {
        return true
      }
    })
    if (currentIndex !== -1) {
      //push latest tab to tabHistory
      tabHistory.splice(currentIndex, 1)
      tabHistory.push(generateHistoryTab(currentTab))
    }
    let preActiveTab = await getPreActiveTabAsync()
    let preActiveTab_chrome = null
    tabs = tabHistory
      .map((tab) => {
        let matchingTab = tabs.find((tab_1) => tab_1.id == tab.id)
        if (!matchingTab) return null
        return { ...matchingTab, lastActiveTime: tab.lastActiveTime }
      })
      .reverse()
      .filter((tab) => tab)
    tabs = tabs.filter((tab) => {
      if (!tab.id) return false
      if (currentTab?.id && tab.id === currentTab.id) return false
      if (preActiveTab?.id && tab.id === preActiveTab?.id) {
        preActiveTab_chrome = tab
        return false
      }
      injectTab(tab)
      return true
    })
    //todo: use group?
    if (preActiveTab) {
      tabs.unshift(
        injectTab(preActiveTab_chrome, false, { desc: "Chrome tab" })
      )
    }
  }

  console.log(tabs, "after tabs")
  if (!isChrome121OrAbove) {
    console.log(tabHistory, "*****: tabHistory")
  }
  actions = actions.concat(tabs)
  console.log(actions, "action")
}

// Get bookmarks to populate in the actions
const getBookmarks = () => {
  const process_bookmark = (bookmarks) => {
    for (const bookmark of bookmarks) {
      if (bookmark.url) {
        actions.push({
          title: bookmark.title,
          desc: "Bookmark",
          id: bookmark.id,
          url: bookmark.url,
          type: "bookmark",
          action: "bookmark",
          emoji: true,
          emojiChar: "⭐️",
          keycheck: false
          // hide: true
        })
      }
      if (bookmark.children) {
        process_bookmark(bookmark.children)
      }
    }
  }

  browserInstance.bookmarks.getRecent(100, process_bookmark)
}

// Lots of different actions
const switchTab = (tab) => {
  browserInstance.tabs.highlight({
    tabs: tab.index,
    windowId: tab.windowId
  })
  browserInstance.windows.update(tab.windowId, { focused: true })
}
const goBack = (tab: chrome.tabs.Tab) => {
  if (tab?.index) {
    browserInstance.tabs.goBack(tab.index)
  }
}
const goForward = (tab) => {
  // browserInstance.tabs.goForward({
  //   tabs: tab.index
  // })
  browserInstance.tabs.goForward(tab.index)
}
const duplicateTab = (tab) => {
  getCurrentTab().then((response) => {
    browserInstance.tabs.duplicate(response.id)
  })
}
const createBookmark = (tab) => {
  getCurrentTab().then((response) => {
    browserInstance.bookmarks.create({
      title: response.title,
      url: response.url
    })
  })
}
const muteTab = (mute) => {
  getCurrentTab().then((response) => {
    browserInstance.tabs.update(response.id, { muted: mute })
  })
}
const reloadTab = () => {
  browserInstance.tabs.reload()
}
const pinTab = (pin) => {
  getCurrentTab().then((response) => {
    browserInstance.tabs.update(response.id, { pinned: pin })
  })
}
const clearAllData = () => {
  browserInstance.browsingData.remove(
    {
      since: new Date().getTime()
    },
    {
      appcache: true,
      cache: true,
      cacheStorage: true,
      cookies: true,
      downloads: true,
      fileSystems: true,
      formData: true,
      history: true,
      indexedDB: true,
      localStorage: true,
      passwords: true,
      serviceWorkers: true,
      webSQL: true
    }
  )
}
const clearBrowsingData = () => {
  browserInstance.browsingData.removeHistory({ since: 0 })
}
const clearCookies = () => {
  browserInstance.browsingData.removeCookies({ since: 0 })
}
const clearCache = () => {
  browserInstance.browsingData.removeCache({ since: 0 })
}
const clearLocalStorage = () => {
  browserInstance.browsingData.removeLocalStorage({ since: 0 })
}
const clearPasswords = () => {
  browserInstance.browsingData.removePasswords({ since: 0 })
}
const openChromeUrl = (url) => {
  browserInstance.tabs.create({ url: "chrome://" + url + "/" })
}
const openIncognito = () => {
  browserInstance.windows.create({ incognito: true })
}
const closeWindow = (id) => {
  browserInstance.windows.remove(id)
}
const closeTab = (tab) => {
  browserInstance.tabs.remove(tab.id)
}
const closeCurrentTab = () => {
  getCurrentTab().then(closeTab)
}
const removeBookmark = (bookmark) => {
  browserInstance.bookmarks.remove(bookmark.id)
}
async function cycleTab() {
  let preActiveTab = await getPreActiveTabAsync()
  if (!preActiveTab) return
  switchTab(preActiveTab)
}
async function getSpecialSearch(callback) {
  let result = await storage.get(["specialSearch"])
  let specialSearch = result?.specialSearch || []
  specialSearch = specialSearch
    .filter((item) => isValidUrl(item.searchUrl))
    .map((item) => {
      const tempURL = new URL(item.searchUrl)
      return {
        title: item.title,
        desc: item.description,
        searchUrl: item.searchUrl,
        type: "action",
        action: "search",
        favIconUrl: getFavicon(tempURL?.host || tempURL?.origin),
        keycheck: false
      }
    })
  callback(specialSearch)
}
// Receive messages from any tab
browserInstance.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    switch (message.request) {
      case "reset-pivoto":
        resetPivoto()
        break
      case "get-actions":
        sendResponse({ actions: actions })
        handleBatch(resetPivoto)
        break
      case "get-Actions": {
        getSpecialSearch((actions) => {
          sendResponse({ actions })
          handleBatch(resetPivoto)
        })

        break
      }
      case "only-open":
        sendResponse({ actions: actions })
        break
      case "switch-tab":
        switchTab(message.tab)
        break
      case "cycle-tab":
        cycleTab()
        break
      case "create-to-tab":
        browserInstance.tabs.create({ url: message.query.url }, function (tab) {
          browserInstance.tabs.update(tab.id, { active: true })
        })
      case "update-tab":
        getCurrentTab().then((currentTab) => {
          browserInstance.tabs.update(currentTab.id, { active: true })
        })
        break
      case "go-back":
        goBack(message.tab)
        break
      case "go-forward":
        goForward(message.tab)
        break
      case "duplicate-tab":
        duplicateTab(message.tab)
        break
      case "create-bookmark":
        createBookmark(message.tab)
        break
      case "mute":
        muteTab(true)
        break
      case "unmute":
        muteTab(false)
        break
      case "reload":
        reloadTab()
        break
      case "pin":
        pinTab(true)
        break
      case "unpin":
        pinTab(false)
        break
      case "remove-all":
        clearAllData()
        break
      case "remove-history":
        clearBrowsingData()
        break
      case "remove-cookies":
        clearCookies()
        break
      case "remove-cache":
        clearCache()
        break
      case "remove-local-storage":
        clearLocalStorage()
        break
      case "remove-passwords":
        clearPasswords()
      case "history": // Fallthrough
      case "downloads":
      case "extensions":
      case "settings":
      case "extensions/shortcuts":
        openChromeUrl(message.request)
        break
      case "manage-data":
        openChromeUrl("settings/clearBrowserData")
        break
      case "incognito":
        openIncognito()
        break
      case "close-window":
        closeWindow(sender.tab.windowId)
        break
      case "close-tab":
        closeCurrentTab()
        break
      case "search-history":
        browserInstance.history
          .search({ text: message.query, maxResults: 0, startTime: 0 })
          .then((data) => {
            // console.log(message.query,'search-history',data);
            sendResponse({
              data: data.map((action) => ({
                type: "history",
                emoji: true,
                emojiChar: "🏛",
                action: "history",
                keycheck: false,
                ...action
              }))
            })
          })
        return true
      case "command-shortcuts":
        browserInstance.commands.getAll((commands) => {
          sendResponse({
            data: commands
          })
        })
        return true
      // case "search-readingList":
      //   chrome.readingList.query({ title: message.query })
      //     .then((data) => {
      //       console.log(message.query,'search-readingList',data);
      //       sendResponse({
      //         readingList: data.map((action) => ({
      //           type: "readingList",
      //           emoji: true,
      //           emojiChar: "🏛",
      //           action: "create-to-tab",
      //           keycheck: false,
      //           ...action
      //         }))
      //       })
      //     })
      //   return true
      case "search-bookmarks":
        if (message.query === "") {
          let results: Action[] = []
          const process_bookmark = (bookmarks) => {
            for (const bookmark of bookmarks) {
              if (bookmark.url) {
                results.push({
                  title: bookmark.title,
                  desc: "Bookmark",
                  id: bookmark.id,
                  url: bookmark.url,
                  type: "bookmark",
                  action: "bookmark",
                  emoji: true,
                  emojiChar: "⭐️",
                  keycheck: false
                })
              }
              if (bookmark.children) {
                process_bookmark(bookmark.children)
              }
            }
            sendResponse({ data: results })
          }

          browserInstance.bookmarks.getRecent(1000, process_bookmark)
        } else {
          browserInstance.bookmarks
            .search({ query: message.query })
            .then((data: Action[]) => {
              // The index property of the bookmark appears to be causing issues, iterating separately...
              data
                .filter((x) => x.index == 0)
                .forEach((action, index) => {
                  if (!action.url) {
                    data.splice(index, 1)
                  }
                  action.type = "bookmark"
                  action.emoji = true
                  action.emojiChar = "⭐️"
                  action.action = "bookmark"
                  action.keycheck = false
                })
              data.forEach((action, index) => {
                if (!action.url) {
                  data.splice(index, 1)
                }
                action.type = "bookmark"
                action.emoji = true
                action.emojiChar = "⭐️"
                action.action = "bookmark"
                action.keycheck = false
              })
              sendResponse({ data: data })
            })
        }
        return true
      case "remove":
        console.log("remove")

        if (message.type == "bookmark") {
          removeBookmark(message.action)
        } else {
          closeTab(message.action)
        }
        break
      case "search":
        const action = message.tab
        const query = message.query
        if (!action.searchUrl) {
          if (!query) {
            chrome.tabs.create({})
            return
          }
          browserInstance.search.query({ text: query })
        } else {
          const { searchUrl } = action
          browserInstance.tabs.create({ url: searchUrl.replace("%s", query) })
        }
        break
      case "restore-new-tab":
        restoreNewTab()
        break
      case "close-pivoto":
        getCurrentTab().then((response) => {
          browserInstance.tabs.sendMessage(response.id, {
            request: "close-pivoto"
          })
        })
        break
    }
  }
)

// Get actions
resetPivoto()
