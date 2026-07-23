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

func combineErrors(combinedErr error, errs ...error) error {
	for _, err := range errs {
		if err != nil {
			if combinedErr == nil {
				combinedErr = err
			} else {
				combinedErr = fmt.Errorf("%v; %w", combinedErr, err)
			}
		}
	}

	return combinedErr
}

// DoWork is the function that is intended to perform the main work of the daemon.
// It takes a context.Context parameter, which can be used to manage cancellation and timeouts for the work being performed.
// It is exported to allow single run work.
func DoWork() error {
	buildManifest, nextData, initialAssetUrls, err := next.FetchInitialNextPageData()
	if err != nil {
		if errors.Is(err, next.CachedBuildIdIsSameError) {
			return err
		}

		return err
	}

	glog.Infof("Got new build ID: %s, proceeding to fetch all site assets and source maps.", nextData.BuildId)
	alerting.Alert(context.Background(), "Build ID Update", fmt.Sprintf("New build ID detected: %s. Proceeding to fetch all site assets and source maps.", nextData.BuildId))

	assets, errs := next.FetchAndResolveAllSiteAssets(nextData.AssetPrefix, initialAssetUrls, buildManifest)
	if len(errs) > 0 {
		return combineErrors(errors.New("error resolving all site assets"), errs...)
	}

	sourceMaps, errs := sourcemap.FetchAndWriteAllSourceMaps(nextData.AssetPrefix, assets)
	if len(errs) > 0 {
		return combineErrors(errors.New("error writing all source maps"), errs...)
	}

	// Calculate the ratio of assets to source maps
	assetCount := len(assets)
	sourceMapCount := len(sourceMaps)
	ratio := float64(sourceMapCount) / float64(assetCount)

	glog.Infof("Successfully fetched and wrote all site assets and source maps. %d/%d, Ratio: %.2f%%", sourceMapCount, assetCount, ratio*100)

	return nil
}
