package sourcemap

import (
	goerrors "errors"
	"net/http"
	"sync"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
)

var sourceMapNotFoundError = goerrors.New("source map not found")

// fetchAllSourceMaps fetches all source maps for the given sources and returns a map of source map URLs to their corresponding CacheGuard objects. It also returns a slice of errors encountered during the fetching process.
func fetchAllSourceMaps(assetPrefix string, sources map[string]*cache.CacheGuard) (map[string]*cache.CacheGuard, []error) {
	waitGroup := &sync.WaitGroup{}
	lock := &sync.Mutex{}
	errorsLock := &sync.Mutex{}

	sourceMapUrlsMap, err := resolveSourceMapUrls(assetPrefix, sources)
	if err != nil {
		return nil, []error{err}
	}

	var errors []error
	sourceMaps := make(map[string]*cache.CacheGuard)

	for _, sourceMapUrls := range sourceMapUrlsMap {
		for _, sourceMapUrl := range sourceMapUrls {
			waitGroup.Add(1)

			go func(sourceMapUrl string) {
				defer waitGroup.Done()

				glog.V(1000).Infof("Fetching source map: %s", sourceMapUrl)

				sourceMapData, err := cache.CacheGuardedHttpGet(sourceMapUrl, func(resp *http.Response) error {
					if resp.StatusCode == http.StatusNotFound {
						return sourceMapNotFoundError
					}

					return nil
				})
				if err != nil {
					if goerrors.Is(err, sourceMapNotFoundError) { // Ignore not found errors, as they are expected for some assets
						glog.V(100).Infof("Source map not found for %s, skipping.", sourceMapUrl)

						return
					}

					errorsLock.Lock()
					defer errorsLock.Unlock()
					errors = append(errors, err)

					return
				}

				lock.Lock()
				defer lock.Unlock()

				sourceMaps[sourceMapUrl] = sourceMapData
			}(sourceMapUrl)
		}
	}

	waitGroup.Wait()

	return sourceMaps, errors
}
