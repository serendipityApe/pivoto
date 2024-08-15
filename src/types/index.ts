export type Action = {
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
  title: string
  CustomIcon?: React.ReactNode
} & Partial<chrome.tabs.Tab>
