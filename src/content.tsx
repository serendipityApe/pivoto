import { useWhyDidYouUpdate } from "ahooks"
import cls from "classnames"
import tailText from "data-text:~/styles/index.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { List } from "react-virtualized"
import AiIcon from "react:~/assets/ai.svg"

import { useLocale } from "~/locales"
import TagInputField from "~components/Input"
import Item from "~components/Item"
import PreItem from "~components/Item/PreItem"
import KeyTag from "~components/KeyTag"
import {
  ADDITIONAL_RESULTS_LENGTH,
  aiKey,
  tagKeys,
  TagStartKey
} from "~constants"
import type { Action } from "~types"
import { processDomain, processDomains, promisify } from "~utils"

import LocaleProvider from "./components/LocaleProvider"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = tailText
  return style
}
export function ContentInner({
  isBlockCycle = false
}: {
  isBlockCycle?: boolean
}) {
  const isAltTimer = useRef(null)

  const [keyStates, setKeyStates] = useState({})
  const [originActions, setOriginActions] = useState<Action[]>([])
  const [isOpen, setIsOpen] = useState(isBlockCycle)
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchValue, setSearchValue] = useState("")
  const [tags, setTags] = useState([])
  const [trieData, setTrieData] = useState([])
  const [InputDisabled, setInputDisabled] = useState(false)
  const [shortcuts, setShortcuts] = useState([])
  const [filteredActions, setFilteredActions] = useState([])

  const isTagMode = useMemo(() => tags.length > 0, [tags])
  const canActiveActions = useMemo(
    () => !searchValue && !isTagMode && !InputDisabled,
    [searchValue, isTagMode, InputDisabled]
  )
  const { t } = useLocale()
  const navigateText = useMemo(() => {
    if (InputDisabled) {
      const shortcut = shortcuts.find((s) => s.name === "cycle-tab").shortcut
      return (
        <div
          id="pivoto-arrows"
          className="text-text3 dark:text-text3Dark  font-medium float-right">
          {t("navigate.hold")}
          <KeyTag>{shortcut[0]}</KeyTag>
          {t("navigate.and.press")}
          <KeyTag>{shortcut[1]}</KeyTag> {t("navigate.to.navigate")}
        </div>
      )
    }
    return (
      <div
        id="pivoto-arrows"
        className="text-text3 dark:text-text3Dark  font-medium float-right">
        {t("navigate.arrows")} <KeyTag>↑</KeyTag>
        <KeyTag>↓</KeyTag> {t("navigate.to.navigate")}
      </div>
    )
  }, [shortcuts, InputDisabled, t])
  const enterText = useMemo(() => {
    if (InputDisabled) {
      const shortcut = shortcuts.find((s) => s.name === "cycle-tab").shortcut
      return (
        <span>
          {t("action.release")} <KeyTag>{shortcut[0]}</KeyTag>
        </span>
      )
    }
    return (
      <span>
        {t("action.select")} <KeyTag>⏎</KeyTag>
      </span>
    )
  }, [shortcuts, InputDisabled, t])

  // useWhyDidYouUpdate("Content", {
  //   isOpen,
  //   originActions,
  //   filteredActions,
  //   searchValue,
  //   keyStates,
  //   tags,
  //   isTagMode,
  //   trieData
  // })

  const open = useCallback(
    (needReset = false, isCycle = false) => {
      !isOpen &&
        chrome.runtime.sendMessage(
          { request: needReset ? "get-actions" : "only-open" },
          (response) => {
            if (isCycle) {
              setInputDisabled(true)
            } else {
              setInputDisabled(false)
            }

            setOriginActions(response.actions)
            setIsOpen(true)
            setActiveIndex(0)
            setTags([])
            setSearchValue("")
          }
        )
    },
    [isOpen]
  )
  function itemActiveUp() {
    setActiveIndex((pre) => (pre > 0 ? pre - 1 : filteredActions.length - 1))
  }
  function itemActiveDown() {
    setActiveIndex((pre) => (pre < filteredActions.length - 1 ? pre + 1 : 0))
  }
  function clearRunTime() {
    clearTimeout(isAltTimer.current)
    isAltTimer.current = null
    setIsOpen(false)
    setSearchValue("")
  }
  function handleAction(index: number) {
    const action = filteredActions[index]

    if (action.type === "ai") {
      setOriginActions([
        {
          favIconUrl:
            "https://www.gstatic.com/devrel-devsite/prod/v5ba20c1e081870fd30b7c8ebfa8711369a575956c1f44323664285c05468c6a4/chrome/images/favicon.png",
          title: t("ai.loading"),
          // desc: t('ai.request.used'),
          // url: "https://chat.openai.com/",
          type: "ai",
          domain: "developer.chrome.com"
        }
      ])
      chrome.runtime.sendMessage(
        {
          request: action.action,
          tab: action,
          query: searchValue
        },
        (response) => {
          clearRunTime()
        }
      )
      return
    }
    clearRunTime()
    if (action.action === "bookmark" || action.action === "history") {
      // window.open(action.url,'_self');
      window.open(action.url)
    } else {
      action.action &&
        chrome.runtime.sendMessage({
          request: action.action,
          tab: action,
          query: searchValue
        })
    }
  }
  function getActions() {
    chrome.runtime.sendMessage({ request: "get-actions" }, (response) => {
      setOriginActions(response.actions)
      setTrieData([
        ...tagKeys.map((key) => TagStartKey + key),
        ...processDomains(response.actions)
      ])
    })
  }
  function removeAction(currentAction) {
    chrome.runtime.sendMessage({
      request: "remove",
      type: currentAction.type,
      action: currentAction
    })
    //todo 乐观更新
    setOriginActions((pre) =>
      pre.filter((action) => action.id !== currentAction.id)
    )
    // getActions()
  }

  const deferredIsTagMode = useDeferredValue(isTagMode)

  useEffect(() => {
    if (tags.includes("bookmark")) {
      chrome.runtime.sendMessage(
        { request: "search-bookmarks", query: searchValue },
        (response) => {
          setOriginActions(response.data)
          !deferredIsTagMode && setTrieData(processDomains(response.data))
        }
      )
    } else if (tags.includes("history")) {
      chrome.runtime.sendMessage(
        { request: "search-history", query: searchValue },
        (response) => {
          setOriginActions(response.data)
          !deferredIsTagMode && setTrieData(processDomains(response.data))
        }
      )
    } else if (tags.includes("ai")) {
      setOriginActions([
        {
          CustomIcon: <AiIcon className="w-6 h-6" />,
          title: t("ai.execute"),
          // desc: t('ai.request.used'),
          // url: "https://chat.openai.com/",
          action: "ai-command",
          type: "ai",
          domain: "developer.chrome.com"
        },
        {
          favIconUrl:
            "https://www.gstatic.com/devrel-devsite/prod/v5ba20c1e081870fd30b7c8ebfa8711369a575956c1f44323664285c05468c6a4/chrome/images/favicon.png",
          title: t("ai.ask"),
          desc: t("ai.request.used"),
          url: "https://chat.openai.com/",
          action: "switch-tab",
          type: "ai",
          domain: "developer.chrome.com"
        }
      ])
    } else if (tags.includes("actions")) {
      chrome.runtime.sendMessage({ request: "get-Actions" }, (response) => {
        const defaultAction = {
          title: searchValue || t("action.open.new.tab"),
          desc: t("action.search.in.chrome"),
          action: "search",
          type: "search",
          url: "https://www.google.com/chrome/"
        }
        const customActions =
          response?.actions?.map((action) => ({
            ...action,
            title: searchValue || action.title
          })) || []

        const actions = customActions
        setOriginActions(actions)
        setTrieData([
          ...tagKeys.map((key) => TagStartKey + key),
          ...processDomains(actions)
        ])
      })
    } else if (deferredIsTagMode === true && !searchValue) {
      setActiveIndex(0)
      getActions()
    }
  }, [tags, searchValue])

  //initial
  useEffect(() => {
    getActions()
    chrome.runtime.sendMessage({ request: "command-shortcuts" }, (response) => {
      setShortcuts(response.data)
    })
  }, [])

  //filter
  useEffect(() => {
    const fetchFilteredActions = async () => {
      if (isTagMode) {
        setFilteredActions(originActions)
        return
      }

      if (searchValue.length > 0) {
        const value = searchValue.toLowerCase()
        let _filteredActions = originActions.filter((action) => {
          if (!action) return false
          return (
            action.url?.toLowerCase().includes(value) ||
            action.title?.toLowerCase().includes(value)
          )
        })

        if (_filteredActions.length < 3) {
          const sendMessagePromise = promisify(chrome.runtime.sendMessage)
          try {
            const historyResponse = await sendMessagePromise({
              request: "search-history",
              query: searchValue
            })
            const bookmarkResponse = await sendMessagePromise({
              request: "search-bookmarks",
              query: searchValue
            })

            setFilteredActions([
              ..._filteredActions,
              ...historyResponse.data.slice(0, ADDITIONAL_RESULTS_LENGTH),
              ...bookmarkResponse.data.slice(0, ADDITIONAL_RESULTS_LENGTH)
            ])
          } catch (error) {
            console.error("Error fetching additional data:", error)
            setFilteredActions(_filteredActions)
          }
        } else {
          setFilteredActions(_filteredActions)
        }
      } else {
        setFilteredActions(originActions)
      }
    }

    fetchFilteredActions()
  }, [originActions, searchValue, isTagMode])

  useEffect(() => {
    const messageHandler = (message) => {
      if (message.request == "open-pivoto") {
        if (isOpen) {
          setIsOpen(false)
        } else {
          open()
        }
      } else if (message.request == "close-pivoto") {
        setIsOpen(false)
      } else if (message.request == "cycle-tab") {
        //open pivoto when alt is press
        if (!isAltTimer.current && !isOpen) {
          isAltTimer.current = setTimeout(() => {
            open(false, true)
          }, 150)
        } else if (isAltTimer.current) {
          itemActiveDown()
        }
      } else if (message.request == "block-cycle-tab") {
        console.log("block-cycle-tab", document.baseURI)
      } else if (message.request == "close-pivoto-iframe") {
        clearRunTime()
      }
    }
    // Recieve messages from background
    chrome.runtime.onMessage.addListener(messageHandler)
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler)
    }
  }, [originActions, open])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default action if one of the handled keys is pressed
      if (
        isOpen &&
        ["ArrowUp", "ArrowDown", "Escape", "Enter"].includes(e.key)
      ) {
        setKeyStates((prevKeyStates) => ({
          ...prevKeyStates,
          [e.key]: true
        }))
        e.preventDefault()
      }
      switch (e.key) {
        case "ArrowUp": // Up key
          itemActiveUp()
          break
        case "ArrowDown": // Down key
          itemActiveDown()
          break
        case "Escape": // Esc key
          if (isOpen) {
            setIsOpen(false)
            isAltTimer.current = null
          }
          break
        case "Enter": // Enter key
          if (isOpen) {
            handleAction(activeIndex)
          }
          break
        case "Tab": //enter search actions
          if (isOpen && canActiveActions) {
            setTags(["actions"])
          }
          break
        // case 'Backspace': // backspace key
        //   if (isOpen) {
        //     removeAction(filteredActions[activeIndex])
        //   }
        //   break
        default:
          break
      }
    }
    const handleKeyUp = (e) => {
      const newKeyStates = { ...keyStates, [e.key]: false }
      if (isOpen && ["Alt", "Shift"].includes(e.key)) {
        e.preventDefault()
        setKeyStates(newKeyStates)
      }
      // if (isOpen && e.key === "Meta" && isBlockCycle) {
      //   if (filteredActions.length) {
      //     handleAction(activeIndex)
      //     //close this tab
      //     window.close()
      //   }
      // }
      if (!e.altKey && isAltTimer.current) {
        if (isOpen) {
          if (filteredActions.length) handleAction(activeIndex)
        } else {
          chrome.runtime.sendMessage({ request: "cycle-tab" })
          setIsOpen(false)
        }
        if (window.self !== window.top) {
          chrome.runtime.sendMessage({ request: "close-pivoto-iframe" })
        }
        clearTimeout(isAltTimer.current)
        isAltTimer.current = null
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [keyStates, isOpen, filteredActions, activeIndex]) // Dependencies for useEffect

  const rowRenderer = ({
    index, // Index of row
    isScrolling, // The List is currently being scrolled
    isVisible, // This row is visible within the List (eg it is not an overscanned row)
    key, // Unique key within array of rendered rows
    parent, // Reference to the parent List (instance)
    style // Style object to be applied to row (to position it);
    // This must be passed through to the rendered row element.
  }) => {
    const action = originActions[index]
    return (
      <Item
        onClick={() => {
          handleAction(index)
        }}
        isActive={activeIndex === index}
        style={style}
        enterText={enterText}
        key={key || action.id || action.desc}
        isTagMode
        {...action}
      />
    )
  }
  const isVirtualList = deferredIsTagMode || isTagMode
  const inputOnchangeHandle = useCallback((value: string) => {
    setSearchValue(value)
    setActiveIndex(0)
  }, [])
  return (
    <LocaleProvider>
      <div
        id="pivoto-extension"
        className={cls("block", {
          hidden: !isOpen || window.self !== window.top
        })}>
        <div
          id="pivoto-wrap"
          className="fixed w-window h-3/4 border border-transparent rounded-md mx-auto my-auto top-0 right-0 bottom-0 left-0 z-max transition-all duration-200 pointer-events-auto">
          <div
            id="pivoto"
            className="shadow-lg box-content absolute w-full bg-background dark:bg-backgroundDark border border-border dark:border-borderDark rounded-lg top-0 left-0 z-max transition-all duration-200 ease-custom block">
            <div id="pivoto-search">
              <TagInputField
                tags={tags}
                setTags={setTags}
                trieData={trieData}
                ref={(e) => e?.focus()}
                disabled={InputDisabled}
                value={searchValue}
                onChange={inputOnchangeHandle}
                showActionsSuggestion={canActiveActions}
              />
            </div>

            {isVirtualList ? (
              <List
                className="scrollbar scrollbar-track-white dark:scrollbar-track-backgroundDark scrollbar-thumb-select dark:scrollbar-thumb-preSelectDark scrollbar-track-border-0"
                scrollToIndex={activeIndex}
                height={400}
                width={700}
                rowHeight={64}
                rowCount={originActions.length}
                rowRenderer={rowRenderer}
              />
            ) : (
              <div
                id="pivoto-list"
                className={cls(
                  "w-full overflow-y-scroll h-full max-h-[400px] min-h-[400px] border-t-1 border-solid border-border dark:border-borderDark relative scrollbar scrollbar-track-white scrollbar-thumb-select dark:scrollbar-track-backgroundDark dark:scrollbar-thumb-preSelectDark scrollbar-track-border-0"
                )}>
                {filteredActions.map((action, index) => (
                  <Item
                    enterText={enterText}
                    onClick={() => {
                      handleAction(index)
                    }}
                    isActive={activeIndex === index}
                    key={action.id || action.desc}
                    {...action}
                  />
                ))}
              </div>
            )}
            <div
              id="pivoto-footer"
              className="h-12 text-sm leading-12 border-t border-border dark:border-borderDark w-full px-6 mr-auto flex items-center justify-between">
              <div
                id="pivoto-results"
                className="text-text3 dark:text-text3Dark  font-medium flex items-center gap-2">
                <span className="dark:text-purple-400 text-sky-400">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    height={16}
                    fill="currentColor">
                    <defs>
                      <mask id="circle-mask">
                        <rect width="24" height="24" fill="white" />
                        <circle cx="12" cy="12" r="3" fill="black" />
                      </mask>
                    </defs>

                    <g mask="url(#circle-mask)">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </g>
                  </svg>
                </span>
                {filteredActions.length} {t("results.count")}
              </div>
              {navigateText}
            </div>
          </div>
        </div>
        <div
          id="pivoto-overlay"
          className="fixed top-0 left-0 bg-[#0003] backdrop-blur-[1px] w-full h-full"
          onClick={() => {
            setIsOpen(false)
            if (isAltTimer.current) isAltTimer.current = null
          }}></div>
      </div>
      {/* <div id="pivoto-extension-toast">
        <img src="" />
        <span>The action has been successful</span>
      </div> */}
    </LocaleProvider>
  )
}

export default function Content() {
  return (
    <LocaleProvider>
      <ContentInner />
    </LocaleProvider>
  )
}
