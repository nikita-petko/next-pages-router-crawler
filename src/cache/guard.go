package cache

import (
	"io"
	gohttp "net/http"
	"os"

	"github.com/golang/glog"
	"github.com/hashicorp/go-retryablehttp"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/http"
)

type CacheGuard struct {
	filePath string
}

func (cg *CacheGuard) GetFilePath() string {
	return cg.filePath
}

func (cg *CacheGuard) Get() ([]byte, error) {
	return os.ReadFile(cg.filePath)
}

type IsValidResponseFunc = func(resp *gohttp.Response) error

// CacheGuardedHttpGet makes an HTTP GET request to the specified URL,
// it returns a path to the cached file if it exists and is not the same as the ETag of the response,
// otherwise it caches the response body to a file and returns the path to the cached file.
func CacheGuardedHttpGet(url string, isValidResponse IsValidResponseFunc) (*CacheGuard, error) {
	resolvedPath, err := ResolveUrlToCachePath(url)
	if err != nil {
		return nil, err
	}

	glog.V(10000).Infof("Resolved cache path for URL: %s, resolved path: %s", url, resolvedPath)

	// Check if the file is cached and if the ETag matches the cached hash
	headResp, err := http.Head(url)
	if err != nil {
		return nil, err
	}

	if isFileCachedByHash(headResp, resolvedPath) {
		glog.V(10000).Infof("Cache hit for URL: %s, returning cached file path: %s", url, resolvedPath)

		return &CacheGuard{filePath: resolvedPath}, nil
	}

	// If the file is not cached or the ETag does not match, cache the response body to a file
	resp, err := retryablehttp.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if isValidResponse != nil {
		if err := isValidResponse(resp); err != nil {
			return nil, err
		}
	}

	// Cache the response body to a file
	bytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	err = writeFileAndUpdateHashMap(resolvedPath, bytes)
	if err != nil {
		return nil, err
	}

	return &CacheGuard{filePath: resolvedPath}, nil
}
