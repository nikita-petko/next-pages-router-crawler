package daemon

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/alerting"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/sourcemap"
)

// DoWork is the function that is intended to perform the main work of the daemon.
// It takes a context.Context parameter, which can be used to manage cancellation and timeouts for the work being performed.
// It is exported to allow single run work.
func DoWork() {
	buildManifest, nextData, initialAssetUrls, err := next.FetchInitialNextPageData()
	if err != nil {
		if errors.Is(err, next.CachedBuildIdIsSameError) {
			glog.Info("Cached build ID is the same as the current build ID, skipping fetch.")

			return
		}

		glog.Errorf("Error fetching initial Next.js page data: %v", err)

		return
	}

	glog.Infof("Got new build ID: %s, proceeding to fetch all site assets and source maps.", nextData.BuildId)
	alerting.Alert(context.Background(), "Build ID Update", fmt.Sprintf("New build ID detected: %s. Proceeding to fetch all site assets and source maps.", nextData.BuildId))

	assets, errs := next.FetchAndResolveAllSiteAssets(nextData.AssetPrefix, initialAssetUrls, buildManifest)
	if len(errs) > 0 {
		glog.Errorf("Error resolving all site assets: %v", errs)

		return
	}

	sourceMaps, errs := sourcemap.FetchAndWriteAllSourceMaps(nextData.AssetPrefix, assets)
	if len(errs) > 0 {
		glog.Errorf("Error writing all source maps: %v", errs)

		return
	}

	// Calculate the ratio of assets to source maps
	assetCount := len(assets)
	sourceMapCount := len(sourceMaps)
	ratio := float64(sourceMapCount) / float64(assetCount)

	glog.Infof("Successfully fetched and wrote all site assets and source maps. %d/%d, Ratio: %.2f%%", sourceMapCount, assetCount, ratio*100)
}
