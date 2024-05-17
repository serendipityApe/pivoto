/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "media",
  content: ["./**/*.tsx"],
  plugins: [require("tailwind-scrollbar")],
  theme: {
    extend: {
      zIndex: {
        max: "9999999999"
      },
      transitionTimingFunction: {
        "custom-easing": "cubic-bezier(0.05, 0.03, 0.35, 1)"
      },
      colors: {
        background: "#fff",
        backgroundDark: "#1e2128",
        border: "#f2f3fb",
        borderDark: "#35373e",
        accent: "#006d77",
        text: "#2b2d41",
        textDark: "#f1f1f1",
        text2: "#2b2d41",
        text2Dark: "#c5c6ca",
        text3: "#717171",
        text3Dark: "#a5a5ae",
        preSelect: "#ededed",
        preSelectDark: "#313540",
        select: "#e5e5e5",
        selectDark: "#17191e",
        bgFavicon: "#f2f2f2",
        bgFaviconDark: "#585860",
        discarded: "grey",
        discardedDark: "#55585d",
        shortcut: "#f2f2f2",
        shortcutDark: "#585860"
      },
      width: {
        window: "702px"
      }
    }
  }
}
