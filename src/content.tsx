import { useWhyDidYouUpdate } from "ahooks"
import cls from "classnames"
import tailText from "data-text:~/styles/index.css"
import type { PlasmoGetStyle } from "plasmo"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { List } from "react-virtualized"

import TagInputField from "~components/Input"
import Item from "~components/Item"
import PreItem from "~components/Item/PreItem"
import { aiKey, tagKeys, TagStartKey } from "~constants"
import type { Action } from "~types/tab"
import { processDomain, processDomains } from "~utils"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = tailText
  return style
}
function Content() {
  const isAltTimer = useRef(null)

  const [keyStates, setKeyStates] = useState({})
  const [originActions, setOriginActions] = useState<Action[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchValue, setSearchValue] = useState("")
  const [tags, setTags] = useState([])
  const [trieData, setTrieData] = useState([])
  const [InputDisabled, setInputDisabled] = useState(false)

  const isTagMode = useMemo(
    () => tags.some((tag) => tagKeys.includes(tag)),
    [tags]
  )
  const filteredActions = useMemo(() => {
    if (isTagMode) return originActions
    if (searchValue.length > 0) {
      const value = searchValue.toLowerCase()
      return originActions.filter((action) => {
        if (!action) return false
        return (
          // action.desc.toLowerCase().includes(value) ||
          action.url?.toLowerCase().includes(value) ||
          action.title?.toLowerCase().includes(value)
        )
      })
    } else {
      return originActions
    }
  }, [originActions, searchValue, isTagMode])
  useWhyDidYouUpdate("Content", {
    isOpen,
    originActions,
    filteredActions,
    searchValue,
    keyStates,
    tags,
    isTagMode,
    trieData
  })
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
  function handleAction(index: number) {
    function clearRunTime() {
      clearTimeout(isAltTimer.current)
      isAltTimer.current = null
      setIsOpen(false)
      setSearchValue("")
    }

    const action = filteredActions[index]
    console.log("handleAction", action)

    if (action.type === "ai") {
      setOriginActions([
        {
          favIconUrl:
            "https://www.gstatic.com/devrel-devsite/prod/v5ba20c1e081870fd30b7c8ebfa8711369a575956c1f44323664285c05468c6a4/chrome/images/favicon.png",
          title: "Loading ai command suggestions...",
          // desc: "Request used: 1 / 100",
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
          console.log(response.data)

          setOriginActions(response.data)
          !deferredIsTagMode && setTrieData(processDomains(response.data))
        }
      )
    } else if (tags.includes("history")) {
      chrome.runtime.sendMessage(
        { request: "search-history", query: searchValue },
        (response) => {
          console.log(response.data)

          setOriginActions(response.data)
          !deferredIsTagMode && setTrieData(processDomains(response.data))
        }
      )
    } else if (tags.includes("ai")) {
      setOriginActions([
        {
          favIconUrl:
            "https://www.gstatic.com/devrel-devsite/prod/v5ba20c1e081870fd30b7c8ebfa8711369a575956c1f44323664285c05468c6a4/chrome/images/favicon.png",
          title: "Execute ai command suggestions",
          // desc: "Request used: 1 / 100",
          // url: "https://chat.openai.com/",
          action: "ai-command",
          type: "ai",
          domain: "developer.chrome.com"
        },
        {
          favIconUrl:
            "https://www.gstatic.com/devrel-devsite/prod/v5ba20c1e081870fd30b7c8ebfa8711369a575956c1f44323664285c05468c6a4/chrome/images/favicon.png",
          title: "Ask chatgpt4",
          desc: "Request used: 1 / 100",
          url: "https://chat.openai.com/",
          action: "switch-tab",
          type: "ai",
          domain: "developer.chrome.com"
        }
      ])
    } else if (deferredIsTagMode === true && !searchValue) {
      getActions()
    }
  }, [tags, searchValue])

  //initial
  useEffect(() => {
    getActions()
  }, [])

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
      // const altShiftP =
      //   newKeyStates["Alt"] && newKeyStates["Shift"] && e.key === "p"
      // const altShiftM =
      //   newKeyStates["Alt"] && newKeyStates["Shift"] && e.key === "m"
      // const altShiftC =
      //   newKeyStates["Alt"] && newKeyStates["Shift"] && e.key === "c"
      // if (altShiftP) {
      //   // updateActionsAndSendRequest('pin-tab');
      // } else if (altShiftM) {
      //   // updateActionsAndSendRequest('mute-tab');
      // } else if (altShiftC) {
      //   window.open("mailto:")
      // } else
      if (!e.altKey && isAltTimer.current) {
        if (isOpen) {
          if (filteredActions.length) handleAction(activeIndex)
        } else {
          chrome.runtime.sendMessage({ request: "cycle-tab" })
          setIsOpen(false)
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
    return isVisible ? (
      <Item
        onClick={() => {
          handleAction(index)
        }}
        isActive={activeIndex === index}
        style={style}
        key={key || action.id || action.desc}
        {...action}
        domain={processDomain(action.url)}
      />
    ) : (
      <PreItem style={style} />
    )
  }
  const isVirtualList = deferredIsTagMode || isTagMode
  return (
    <>
      <div
        id="pivoto-extension"
        className={cls("block", {
          hidden: !isOpen
        })}>
        <div
          id="pivoto-wrap"
          className="fixed w-window h-3/4 border border-transparent rounded-md mx-auto my-auto top-0 right-0 bottom-0 left-0 z-max transition-all duration-200 pointer-events-auto">
          <div
            id="pivoto"
            className="shadow-lg box-content absolute w-full bg-background border border-border rounded-lg top-0 left-0 z-max transition-all duration-200 ease-custom block">
            <div id="pivoto-search">
              <TagInputField
                tags={tags}
                setTags={setTags}
                trieData={trieData}
                ref={(e) => e?.focus()}
                disabled={InputDisabled}
                value={searchValue}
                onChange={(value) => {
                  setSearchValue(value)
                  setActiveIndex(0)
                }}
              />
            </div>

            {isVirtualList ? (
              <List
                className="scrollbar scrollbar-track-white scrollbar-thumb-select scrollbar-track-border-0"
                scrollToIndex={activeIndex}
                height={400}
                width={700}
                rowHeight={60}
                rowCount={originActions.length}
                rowRenderer={rowRenderer}
              />
            ) : (
              <div
                id="pivoto-list"
                className={cls(
                  "w-full overflow-y-scroll h-full max-h-[400px] min-h-[400px] border-t-1 border-solid border-border relative scrollbar scrollbar-track-white scrollbar-thumb-select scrollbar-track-border-0"
                )}>
                {filteredActions.map((action, index) => (
                  <Item
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
              className="h-12 text-sm leading-12 border-t border-border w-full px-6 mr-auto flex items-center justify-between">
              <div id="pivoto-results" className="text-text3 font-medium">
                {filteredActions.length} results
              </div>
              <div
                id="pivoto-arrows"
                className="text-text3 font-medium float-right">
                Use arrow keys{" "}
                <span className="inline-block rounded bg-shortcut text-text text-center h-5 leading-5 min-w-5 px-1 mx-1">
                  ↑
                </span>
                <span className="inline-block rounded bg-shortcut text-text text-center h-5 leading-5 min-w-5 px-1 mx-1">
                  ↓
                </span>{" "}
                to navigate
              </div>
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
    </>
  )
}

export default Content
