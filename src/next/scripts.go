package next

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/html"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
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

func resolveBuildManifestChunkUrls(assetPrefix string, buildManifest *types.BuildManifest) ([]string, error) {
	baseUrl, err := url.GetBaseUrl(assetPrefix)
	if err != nil {
		return nil, err
	}

	var scriptUrls []string

	for _, chunks := range buildManifest.PageChunks {
		for _, url := range chunks {
			url = fmt.Sprintf("%s/_next/%s", baseUrl, url)

			scriptUrls = append(scriptUrls, url)
		}
	}

	return scriptUrls, nil
}

// GetAllUniqueSiteScripts gets all unique script URLs from the provided NextPageData list
func GetAllUniqueSiteScripts(assetPrefix string, initialPageScriptUrls []string, buildManifest *types.BuildManifest, pages []*types.NextPageData) ([]string, error) {
	manifestUrls, err := resolveBuildManifestChunkUrls(assetPrefix, buildManifest)
	if err != nil {
		return nil, err
	}

	var scriptUrls []string

	for _, page := range pages {
		scriptUrls := page.ScriptUrls

		scriptUrls = append(scriptUrls, page.ScriptUrls...)
	}

	scriptUrls = append(scriptUrls, initialPageScriptUrls...)
	scriptUrls = append(scriptUrls, manifestUrls...)

	// Remove duplicates
	slices.Sort(scriptUrls)
	scriptUrls = slices.Compact(scriptUrls)

	return scriptUrls, nil
}
