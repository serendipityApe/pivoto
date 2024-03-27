/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    darkMode: "class",
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
          border: "#f2f3fb",
          accent: "#006d77",
          text: "#2b2d41",
          text2: "#2b2d41",
          text3: "#717171",
          preSelect: "#ededed",
          select: "#e5e5e5",
          bgFavicon: "#f2f2f2",
          discarded: "grey",
          shortcut: "#f2f2f2"
        },
        width: {
          window: "702px"
        }
      }
    }
  }
  