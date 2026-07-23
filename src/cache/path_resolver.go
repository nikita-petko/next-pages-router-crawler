package cache

import (
	gourl "net/url"
	"path"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

// ResolveUrlToCachePath takes a URL string and returns the corresponding cache file path.
func ResolveUrlToCachePath(url string) (string, error) {
	// Normalize the URL to create a valid file path
	// Replace special characters with underscores

	uri, err := gourl.Parse(url)
	if err != nil {
		return "", err
	}

	// Construct the cache path using the host and path of the URL
	cachePath := path.Join(*flags.CachePath, uri.Host, uri.Path+".cache")

	return cachePath, nil
}
