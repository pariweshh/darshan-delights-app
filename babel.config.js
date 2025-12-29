module.exports = function (api) {
  api.cache(true)

  const plugins = []

  if (
    process.env.NODE_ENV === "production" ||
    process.env.BABEL_ENV === "production"
  ) {
    plugins.push(["transform-remove-console", { exclude: ["error", "warn"] }])
  }
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  }
}
