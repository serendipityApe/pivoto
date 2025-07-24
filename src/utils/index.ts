export function getLastActiveTimeString(lastActiveTime: number, t?: (key: string) => string) {
  function padTo2Digits(num: number) {
    return num.toString().padStart(2, "0")
  }
  
  // 如果没有传入翻译函数，使用默认的英文
  const translate = t || ((key: string) => {
    const defaultTranslations: { [key: string]: string } = {
      "time.second.singular": "second ago",
      "time.second.plural": "seconds ago",
      "time.minute.singular": "minute ago",
      "time.minute.plural": "minutes ago",
      "time.hour.singular": "hour ago",
      "time.hour.plural": "hours ago",
      "time.day.singular": "day ago",
      "time.day.plural": "days ago"
    }
    return defaultTranslations[key] || key
  })
  
  if (lastActiveTime) {
    const millisecondsAgo = Date.now() - lastActiveTime
    const secondsAgo = Math.floor(millisecondsAgo / 1000)
    const minutesAgo = Math.floor(secondsAgo / 60)
    const hoursAgo = Math.floor(minutesAgo / 60)
    const daysAgo = Math.floor(hoursAgo / 24)

    if (secondsAgo < 60) {
      return secondsAgo + " " + translate(secondsAgo === 1 ? "time.second.singular" : "time.second.plural")
    } else if (minutesAgo < 60) {
      return minutesAgo + " " + translate(minutesAgo === 1 ? "time.minute.singular" : "time.minute.plural")
    } else if (hoursAgo < 24) {
      return hoursAgo + " " + translate(hoursAgo === 1 ? "time.hour.singular" : "time.hour.plural")
    } else if (daysAgo === 1) {
      return "1 " + translate("time.day.singular")
    } else if (daysAgo > 1) {
      const date = new Date(lastActiveTime)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // getMonth returns 0-11
      const day = date.getDate()
      const hour = date.getHours()
      const minute = date.getMinutes()
      const formattedDate = `${year}-${padTo2Digits(month)}-${padTo2Digits(day)} ${padTo2Digits(hour)}:${padTo2Digits(minute)}`
      return formattedDate
    }
  }
  return null
}

export function corsTranslate(text) {
  return text?.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function getFaviconUrl(url) {
  if (process.env.PLASMO_BROWSER === "firefox") {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&size=32`
  }
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`
}
export function processDomain(url: string) {
  return url ? new URL(url).hostname : null
}

export function processDomains(
  actions: {
    [key: string]: string
    domain: string
  }[]
) {
  const uniqueDomains = new Set()
  const processed = []

  actions.forEach((action) => {
    let domain = action?.domain
    if (!domain && action?.url) {
      domain = processDomain(action.url)
    }

    if (domain?.startsWith("www.")) {
      const nonWwwDomain = domain.substring(4)
      uniqueDomains.add(domain)
      uniqueDomains.add(nonWwwDomain)
    } else {
      uniqueDomains.add(domain || action?.url || "")
    }
  })

  uniqueDomains.forEach((domain) => processed.push(domain))

  return processed
}

export function promisify(fn) {
  return function (...args) {
    return new Promise<any>((resolve, reject) => {
      fn(...args, (result) => {
        resolve(result)
      })
    })
  }
}
