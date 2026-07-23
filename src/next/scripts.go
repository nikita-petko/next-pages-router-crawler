package next

import (
	"errors"
	"fmt"
	"strings"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/html"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/url"
	gohtml "golang.org/x/net/html"
)

func isIgnoredScriptUrl(scriptUrl string) bool {
	for _, ignoredScript := range ignoreScripts {
		if strings.HasSuffix(scriptUrl, ignoredScript) {
			return true
		}
	}
	return false
}

// getAllNextScriptUrls gets all URLs from all script tags in the provided HTML head node and returns them as a slice of strings.
func getAllNextScriptUrls(assetPrefix string, htmlHead *gohtml.Node) ([]string, error) {
	scriptTags := html.GetAllElementsOfType("script", htmlHead)

	if len(scriptTags) == 0 {
		return nil, errors.New("html head contained no script tags!")
	}

	baseUrl, err := url.GetBaseUrl(assetPrefix)
	if err != nil {
		return nil, err
	}

	nextPrefixedUrl := "/_next"
	if assetPrefix != "" {
		nextPrefixedUrl = fmt.Sprintf("%s%s", assetPrefix, nextPrefixedUrl)
	}

	// Filter only next.js scripts
	var scriptUrls []string

SCRIPTS:
	for _, scriptTag := range scriptTags {
		for _, attr := range scriptTag.Attr {
			if attr.Key == "src" {
				scriptUrl := attr.Val

				if isIgnoredScriptUrl(scriptUrl) {
					continue SCRIPTS
				}

				// Only include scripts that start with the next.js prefix
				if strings.HasPrefix(scriptUrl, nextPrefixedUrl) {
					// For non-prefixed urls prepend the baseUrl
					if assetPrefix == "" {
						scriptUrl = fmt.Sprintf("%s%s", baseUrl, scriptUrl)
					}

					scriptUrls = append(scriptUrls, scriptUrl)
				}

				break
			}
		}
	}

	if len(scriptUrls) == 0 {
		return nil, fmt.Errorf("html head contained no script tags with a src attribute starting with '%s'!", nextPrefixedUrl)
	}

	return scriptUrls, nil
}
