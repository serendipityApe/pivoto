import { createContext, useContext } from "react"

export type Language = "en" | "zh"

export interface Translations {
  [key: string]: string
}

export interface LocaleContextType {
  locale: Language
  setLocale: (locale: Language) => void
  t: (key: string) => string
}

export const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => {
    return key
  }
})

export const useLocale = () => useContext(LocaleContext)

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation and UI elements
    "navigate.arrows": "Use arrow keys",
    "navigate.hold": "Hold",
    "navigate.and.press": "and press",
    "navigate.to.navigate": "to navigate",
    "action.select": "Select",
    "action.release": "Release",
    "results.count": "results",
    "search.actions": "Search Actions",

    // Input placeholders
    "input.disabled": "Disabled input",
    "input.search.bookmarks": "Search bookmarks",
    "input.search.history": "Search history",
    "input.search.ai": "Ask a question or describe your needs",
    "input.search.actions": "Search actions",
    "input.search.default": "Search tabs or type @ to select a command",

    // AI related
    "ai.execute": "Execute ai command suggestions",
    "ai.ask": "Ask chatgpt4",
    "ai.loading": "Loading ai command suggestions...",
    "ai.request.used": "Request used: 1 / 100",

    // Action types
    "action.type.bookmark": "Bookmark",
    "action.type.history": "History",

    // Default actions
    "action.open.new.tab": "open new tab",
    "action.search.in.chrome": "Search in chrome"
  },
  zh: {
    // Navigation and UI elements
    "navigate.arrows": "使用方向键",
    "navigate.hold": "按住",
    "navigate.and.press": "并点按",
    "navigate.to.navigate": "进行导航",
    "action.select": "选择",
    "action.release": "释放",
    "results.count": "个结果",
    "search.actions": "搜索操作",

    // Input placeholders
    "input.disabled": "输入已禁用",
    "input.search.bookmarks": "搜索书签",
    "input.search.history": "搜索历史",
    "input.search.ai": "提问或描述您的需求",
    "input.search.actions": "搜索操作",
    "input.search.default": "搜索标签页或输入 @ 选择命令",

    // AI related
    "ai.execute": "执行AI命令建议",
    "ai.ask": "询问ChatGPT4",
    "ai.loading": "正在加载AI命令建议...",
    "ai.request.used": "已使用请求: 1 / 100",

    // Action types
    "action.type.bookmark": "书签",
    "action.type.history": "历史",

    // Default actions
    "action.open.new.tab": "打开新标签页",
    "action.search.in.chrome": "在Chrome中搜索"
  }
}
