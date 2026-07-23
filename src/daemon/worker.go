package daemon

import (
	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next"
)

// DoWork is the function that is intended to perform the main work of the daemon.
// It takes a context.Context parameter, which can be used to manage cancellation and timeouts for the work being performed.
// It is exported to allow single run work.
func DoWork() {
	buildManifest, nextData, initialScriptUrls, err := next.FetchInitialNextPageData()
	if err != nil {
		glog.Errorf("Error fetching initial Next.js page data: %v", err)

		return
	}

	pages, errs := next.FetchAllNextPages(buildManifest)
	if len(errs) > 0 {
		glog.Errorf("Error fetching all Next.js pages: %v", errs)

		return
	}

	scripts, errs := next.ResolveAllSiteScripts(nextData.AssetPrefix, initialScriptUrls, pages)
	if len(errs) > 0 {
		glog.Errorf("Error resolving all site scripts: %v", errs)

		return
	}

	glog.Infof("Successfully resolved all site scripts. Total scripts resolved: %d", len(scripts))
}
