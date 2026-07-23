package next

const NextDataScriptId = "__NEXT_DATA__"

const IndexPage = "/"
const AppPage = "/_app"

// ignorePages is a list of pages that should be ignored when crawling the Next.js application.
//
// Index is ignored because it is the root page and is already crawled by default.
// AppPage is ignored because it is the Next.js app page and is not a real page that can be crawled. (every page will include the _app.jsx/tsx anyway in source maps)
var ignorePages = []string{IndexPage, AppPage}

const BuildManifestScript = "_buildManifest.js"
const SsgManifestScript = "_ssgManifest.js"
const ClientMiddlewareManifestScript = "_clientMiddlewareManifest.js"

var ignoreScripts = []string{BuildManifestScript, SsgManifestScript, ClientMiddlewareManifestScript}
