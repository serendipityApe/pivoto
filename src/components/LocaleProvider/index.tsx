import React, { useEffect, useState } from "react"

import { LocaleContext, translations } from "~/locales"
import type { Language } from "~/locales"

interface LocaleProviderProps {
  children: React.ReactNode
}

const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  // Get initial locale from browser or localStorage
  const getInitialLocale = (): Language => {
    // Try to get from localStorage first
    const savedLocale = localStorage.getItem("pivoto-locale")
    if (savedLocale && (savedLocale === "en" || savedLocale === "zh")) {
      return savedLocale as Language
    }

    // Fall back to browser language preference
    const browserLang = navigator.language.split("-")[0]
    return browserLang === "zh" ? "zh" : "en"
  }

  const [locale, setLocaleState] = useState<Language>(getInitialLocale())

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Language) => {
    setLocaleState(newLocale)
    localStorage.setItem("pivoto-locale", newLocale)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[locale][key] || key
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export default LocaleProvider
