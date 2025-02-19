/**
 * @type {import('postcss').ProcessOptions}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-rem-to-pixel": {
      rootValue: 16,
      propList: ["*"],
      unitPrecision: 5,
      mediaQuery: false,
      minRemValue: 0
    }
  }
}
