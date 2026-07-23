package types

// BuildManifest contains the needed data from the build manifest in the Next.js application.
// It is sourced from /_next/static/{buildId}/_buildManifest.js and is used to determine the order of crawling for the pages in the application.
type BuildManifest struct {
	// SortedPages is a list of all the pages in the Next.js application, sorted in the order they should be crawled.
	// This is used to determine the order of crawling for the pages in the application.
	SortedPages []string

	// PageChunks is a map of page URLs to their corresponding chunk files.
	PageChunks map[string][]string
}
