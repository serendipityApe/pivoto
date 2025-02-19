import { useWhyDidYouUpdate } from "ahooks"
import cls from "classnames"
import React, {
  forwardRef,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import KeyTag from "~components/KeyTag"
import { tagKeys, TagStartKey } from "~constants"
import { Trie } from "~utils/trie"

type TagInputFieldProps = {
  tags: string[]
  trieData?: string[]
  value?: string
  disabled?: boolean
  setTags: React.Dispatch<React.SetStateAction<string[]>>
  onChange?: (latestValue: string) => void
  showActionsSuggestion?: boolean
}
const TagInputField = forwardRef<HTMLInputElement, TagInputFieldProps>(
  (props, ref) => {
    const {
      trieData = [],
      onChange: propOnChange,
      tags,
      setTags,
      value,
      disabled,
      showActionsSuggestion
    } = props
    const [input, setInputOrigin] = useState("")
    useEffect(() => {
      if (value !== undefined && value !== input) {
        //only clear input
        setInputOrigin(value)
        setSuggestion("")
      }
    }, [value])
    const setInput = (v: string) => {
      setInputOrigin(v)
      // startTransition(() => {
      propOnChange?.(v)
      // })
    }
    const [isKeyReleased, setIsKeyReleased] = useState(false)
    const activeTagMode = input.startsWith(TagStartKey) && tags.length < 1
    const [suggestion, setSuggestion] = useState("")
    useWhyDidYouUpdate("Input", {
      tags,
      input,
      suggestion,
      propOnChange
    })
    // 创建 Trie 树并插入数据
    const trie = useMemo(() => {
      const trie = new Trie()
      trieData.forEach((item) => trie.insert(item))
      return trie
    }, [trieData])

    const onChange = (e) => {
      const value = e.target.value
      setInput(value)
      startTransition(() => {
        const bestMatch = value ? trie.searchBestMatch(value) : ""
        setSuggestion(bestMatch)
      })
    }

    const onKeyDown = (e) => {
      const { key } = e
      switch (key) {
        case "Tab":
          e.preventDefault()
          if (suggestion) {
            if (activeTagMode) {
              const trimmedInput = suggestion.trim().slice(1)
              if (tagKeys.includes(trimmedInput)) {
                setTags((prevState) => [...prevState, trimmedInput])
                setInput("")
              }
            } else {
              // redo is valid when call document.execCommand
              let tmpRes = document.execCommand(
                "insertText",
                false,
                suggestion.slice(input.length)
              )
              if (!tmpRes) {
                setInput(suggestion)
              }
            }
            setSuggestion("")
          }
          break
        case "Backspace":
          if (!input.length && tags.length && isKeyReleased) {
            e.preventDefault()
            setTags((prevState) => prevState.slice(0, -1))
          }
          setIsKeyReleased(false)
          break
        default:
          if (/^[a-zA-Z]$/.test(e.key)) {
            // e.preventDefault()
            e.stopPropagation()
          }
          break
      }
    }

    const onKeyUp = () => {
      setIsKeyReleased(true)
    }
    const placeholderText = useMemo(() => {
      if (disabled) return "Disabled input"
      switch (tags[0]) {
        case "bookmark":
          return "Search bookmarks"
        case "history":
          return "Search history"
        case "ai":
          return "Ask a question or describe your needs"
        case "actions":
          return "Search actions"
        default:
          return `Search tabs or type ${TagStartKey} to select a command`
      }
    }, [tags, disabled])
    // const deleteTag = (index) => {
    //   setTags((prevState) => prevState.filter((tag, i) => i !== index))
    // }
    const inputCls =
      "bg-transparent absolute outline-none text-2xl flex-grow min-w-1/2 border-0 rounded-md p-0 ml-0 font-normal h-12 w-3/4 mx-auto block text-text caret-accent font-inter box-border shadow-none"
    return (
      <div className="flex overflow-auto pl-6 text-black items-center border-0 border-b border-solid border-select dark:border-selectDark">
        {tags.map((tag, index) => (
          <div
            className="text-base flex items-center my-1 mr-2.5 py-1.5 px-2.5 font-medium rounded-lg text-sky-600 dark:text-sky-400 bg-sky-400/10 whitespace-nowrap max-h-8"
            key={index}>
            {tag}
            {/* <button onClick={() => deleteTag(index)}>x</button> */}
          </div>
        ))}
        <span className="relative w-full h-16 flex items-center">
          <input
            className={cls(inputCls, "dark:text-textDark")}
            ref={ref}
            disabled={disabled}
            value={input}
            type="text"
            placeholder={placeholderText}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onChange={onChange}
          />
          {suggestion && (
            <input
              disabled
              className={cls(inputCls, "text-text3 dark:text-slate-500 -z-10")}
              value={suggestion}
            />
          )}
          {showActionsSuggestion && (
            <span className="absolute right-4 text-gray-400 text-sm">
              Search Actions <KeyTag>Tab</KeyTag>
            </span>
          )}
        </span>
      </div>
    )
  }
)

export default TagInputField
