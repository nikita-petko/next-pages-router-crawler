package sourcemap

const sourceMappingUrlRegex = `(?:/\*(?:\s*(?://)?)?(?:[#@] sourceMappingURL=([^\s'"]*))\s*\*/|//(?:[#@] sourceMappingURL=([^\s'"]*)))`

const webpackPrefix = "webpack://"
const turboPrefix = "turbopack://"
