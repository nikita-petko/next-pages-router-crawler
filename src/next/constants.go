package next

const dynamicImportRegex = `static/chunks/[^"]+`

const nextDataScriptId = "__NEXT_DATA__"

const indexPage = "/"
const appPage = "/_app"

var ignorePages = []string{indexPage, appPage}

const buildManifestScript = "_buildManifest.js"
const ssgManifestScript = "_ssgManifest.js"
const clientMiddlewareManifestScript = "_clientMiddlewareManifest.js"

var ignoreScripts = []string{buildManifestScript, ssgManifestScript, clientMiddlewareManifestScript}
