package next

import (
	"errors"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
)

var CachedBuildIdIsSameError = errors.New("cached build ID is the same as the current build ID, skipping fetch")

// FetchInitialNextPageData fetches the initial Next.js page data, including the build manifest, NextData, and script URLs.
func FetchInitialNextPageData() (buildManifest *types.BuildManifest, nextData *types.NextData, scriptUrls []string, err error) {
	// Ensure trailing slash for cache path
	url := *flags.Url
	if url[len(url)-1] != '/' {
		url += "/"
	}

	nextData, scriptUrls, err = fetchNextPageData(url)
	if err != nil {
		return
	}

	cachedBuildId, err := cache.ReadBuildId(url)
	if err != nil {
		return
	}

	if nextData.BuildId == cachedBuildId {
		err = CachedBuildIdIsSameError

		return
	}

	err = cache.WriteBuildId(url, nextData.BuildId)
	if err != nil {
		return
	}

	buildManifest, err = getBuildManifest(nextData)
	if err != nil {
		return
	}

	return
}
