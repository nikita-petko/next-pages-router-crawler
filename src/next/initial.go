package next

import (
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/html"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
)

// FetchInitialNextPageData fetches the initial Next.js page data, including the build manifest, NextData, and script URLs.
func FetchInitialNextPageData() (buildManifest *types.BuildManifest, nextData *types.NextData, scriptUrls []string, err error) {
	nextData, scriptUrls, err = FetchNextPageData(*flags.Url)
	if err != nil {
		return
	}

	buildManifest, err = html.GetBuildManifest(nextData)
	if err != nil {
		return
	}

	return
}
