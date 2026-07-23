package daemon

import (
	"errors"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/sourcemap"
)

// DoWork is the function that is intended to perform the main work of the daemon.
// It takes a context.Context parameter, which can be used to manage cancellation and timeouts for the work being performed.
// It is exported to allow single run work.
func DoWork() {
	buildManifest, nextData, initialScriptUrls, err := next.FetchInitialNextPageData()
	if err != nil {
		if errors.Is(err, next.CachedBuildIdIsSameError) {
			glog.Info("Cached build ID is the same as the current build ID, skipping fetch.")

			return
		}

		glog.Errorf("Error fetching initial Next.js page data: %v", err)

		return
	}

	glog.Infof("Got new build ID: %s, proceeding to fetch all site scripts and source maps.", nextData.BuildId)

	scripts, errs := next.FetchAndResolveAllSiteScripts(nextData.AssetPrefix, initialScriptUrls, buildManifest)
	if len(errs) > 0 {
		glog.Errorf("Error resolving all site scripts: %v", errs)

		return
	}

	errs = sourcemap.FetchAndWriteAllSourceMaps(nextData.AssetPrefix, scripts)
	if len(errs) > 0 {
		glog.Errorf("Error writing all source maps: %v", errs)

		return
	}

	glog.Infof("Successfully resolved all site scripts. Total scripts resolved: %d", len(scripts))
}
