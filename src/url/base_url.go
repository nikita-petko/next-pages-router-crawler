package url

import (
	gourl "net/url"
	"path"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

// extractBaseUrl extracts the baseUrl from the URL configured
func extractBaseUrl() (string, error) {
	u, err := gourl.Parse(*flags.Url)
	if err != nil {
		return "", err
	}

	u.Path = path.Clean(u.Path)
	u.RawQuery = ""
	u.Fragment = ""

	if u.Path == "/" {
		u.Path = ""
	}

	return u.String(), nil
}

// GetBaseUrl returns the baseUrl from the assetPrefix if it is set, otherwise it extracts the baseUrl from the configured URL.
func GetBaseUrl(assetPrefix string) (string, error) {
	if assetPrefix != "" {
		assetUrl, err := gourl.Parse(assetPrefix)
		if err != nil {
			return "", err
		}

		// Trim out trailing slashes:
		assetUrl.Path = path.Clean(assetUrl.Path)

		return assetUrl.String(), nil
	}

	return extractBaseUrl()
}
