import React from "react"

type Props = {
  // Define your component props here
  children?: React.ReactNode
}

const KeyTag: React.FC<Props> = ({ children }) => {
  // Component logic goes here

  return (
    // JSX markup goes here
    <span className="inline-block rounded bg-shortcut dark:bg-shortcutDark text-text dark:text-textDark text-center h-5 leading-5 min-w-5 px-1 mx-1">
      {children}
    </span>
  )
}

export default KeyTag
