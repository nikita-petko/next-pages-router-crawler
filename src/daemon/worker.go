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

	scriptUrls, err := next.GetAllUniqueSiteScripts(nextData.AssetPrefix, initialScriptUrls, buildManifest, pages)
	if err != nil {
		glog.Errorf("Error getting all unique site scripts: %v", err)

		return
	}

	glog.Infof("Successfully fetched script URLs: %+v", scriptUrls)
}
