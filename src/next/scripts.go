package next

import (
	"errors"
	"fmt"
	"maps"
	"net/http"
	"regexp"
	"slices"
	"strings"
	"sync"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
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

// getAllUniquePageScripts gets all unique script URLs from the provided NextPageData list
// This does not include any dynamically fetched (at runtime) scripts
func getAllUniquePageScripts(initialPageScriptUrls []string, pages []*types.NextPageData) ([]string, error) {
	var scriptUrls []string

	for _, page := range pages {
		scriptUrls = append(scriptUrls, page.ScriptUrls...)
	}

	scriptUrls = append(scriptUrls, initialPageScriptUrls...)

	// Remove duplicates
	slices.Sort(scriptUrls)
	scriptUrls = slices.Compact(scriptUrls)

	return scriptUrls, nil
}

func isValidChunkDataType(contentType string) bool {
	return strings.HasPrefix(contentType, "text/javascript") ||
		strings.HasPrefix(contentType, "application/javascript") ||
		strings.HasPrefix(contentType, "text/css") ||
		strings.HasPrefix(contentType, "application/json")
}

// fetchAllScripts fetches the content of all scripts from the provided script URLs and returns a map of script URL to script content (as a byte slice).
func fetchAllScripts(scriptUrls []string) (map[string]*cache.CacheGuard, []error) {
	waitGroup := &sync.WaitGroup{}
	lock := &sync.Mutex{}
	errorsLock := &sync.Mutex{}

	waitGroup.Add(len(scriptUrls))

	var scriptDataMap = make(map[string]*cache.CacheGuard)
	var errors []error

	for _, scriptUrl := range scriptUrls {
		go func(scriptUrl string) {
			defer waitGroup.Done()

			glog.V(100).Infof("Fetching script: %s", scriptUrl)

			cached, err := cache.CacheGuardedHttpGet(scriptUrl, func(resp *http.Response) error {
				if resp.StatusCode != http.StatusOK || !isValidChunkDataType(resp.Header.Get("Content-Type")) {

					return fmt.Errorf("failed to fetch script %s: status code %d, content type %s", scriptUrl, resp.StatusCode, resp.Header.Get("Content-Type"))
				}

				return nil
			})
			if err != nil {
				errorsLock.Lock()
				defer errorsLock.Unlock()

				errors = append(errors, err)

				return
			}

			lock.Lock()
			defer lock.Unlock()

			scriptDataMap[scriptUrl] = cached
		}(scriptUrl)
	}

	waitGroup.Wait()

	return scriptDataMap, errors
}

// resolveDynamicScriptsFromBundle takes the assetPrefix,
// the script data (as a string),
// and the existing script URLs,
// and returns a slice of dynamic script URLs that are found in the script data but
// not already in the existing script URLs.
func resolveDynamicScriptsFromBundle(assetPrefix string, scriptDataCached *cache.CacheGuard, existingScriptUrls []string) ([]string, error) {
	scriptData, err := scriptDataCached.Get()
	if err != nil {
		return nil, err
	}

	matches := regexp.MustCompile(dynamicImportRegex).FindAllString(string(scriptData), -1)
	if matches == nil {
		return []string{}, nil
	}

	baseUrl, err := url.GetBaseUrl(assetPrefix)
	if err != nil {
		return nil, err
	}

	var dynamicScriptUrls []string

	for _, match := range matches {
		dynamicScriptUrl := fmt.Sprintf("%s/_next/%s", baseUrl, match)

		// Only include the dynamic script if it is not already in the existing script URLs
		if !slices.Contains(existingScriptUrls, dynamicScriptUrl) {
			dynamicScriptUrls = append(dynamicScriptUrls, dynamicScriptUrl)
		}
	}

	return dynamicScriptUrls, nil
}

// recursiveResolveDynamicScripts takes the assetPrefix, the script data (as a string),
// the existing script URLs, and a map of already resolved dynamic script URLs,
// and returns a slice of all dynamic script URLs that are found in the script data but
// not already in the existing script URLs or the already resolved dynamic script URLs.
//
// This function is recursive,
// meaning it will continue to resolve dynamic scripts from the newly found dynamic scripts
// until no new dynamic scripts are found.
func recursiveResolveDynamicScripts(assetPrefix string, scriptDataCached *cache.CacheGuard, existingScriptUrls []string, resolvedDynamicScriptUrls map[string]bool) ([]string, []error) {
	dynamicScriptUrls, err := resolveDynamicScriptsFromBundle(assetPrefix, scriptDataCached, existingScriptUrls)
	if err != nil {
		return nil, []error{err}
	}

	var newDynamicScriptUrls []string

	for _, dynamicScriptUrl := range dynamicScriptUrls {
		if !resolvedDynamicScriptUrls[dynamicScriptUrl] {
			resolvedDynamicScriptUrls[dynamicScriptUrl] = true
			newDynamicScriptUrls = append(newDynamicScriptUrls, dynamicScriptUrl)
		}
	}

	if len(newDynamicScriptUrls) == 0 {
		return []string{}, nil
	}

	scriptDataMap, errors := fetchAllScripts(newDynamicScriptUrls)
	if len(errors) > 0 {
		return nil, errors
	}

	for _, dynamicScriptUrl := range newDynamicScriptUrls {
		scriptData := scriptDataMap[dynamicScriptUrl]

		// Recursively resolve dynamic scripts from the newly found dynamic script
		recursivelyResolvedDynamicScriptUrls, errors := recursiveResolveDynamicScripts(assetPrefix, scriptData, existingScriptUrls, resolvedDynamicScriptUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		newDynamicScriptUrls = append(newDynamicScriptUrls, recursivelyResolvedDynamicScriptUrls...)
	}

	return newDynamicScriptUrls, nil
}

// resolveAllSiteScripts takes the assetPrefix, the initial script URLs from the initial Next.js page data,
// and the list of all NextPageData, and returns a map of all script URLs to their content (as a string).
func resolveAllSiteScripts(assetPrefix string, initialPageScriptUrls []string, pages []*types.NextPageData) (map[string]*cache.CacheGuard, []error) {
	initialScriptUrls, err := getAllUniquePageScripts(initialPageScriptUrls, pages)
	if err != nil {
		return nil, []error{err}
	}

	// Initial scripts fetch
	initialScripts, errors := fetchAllScripts(initialScriptUrls)

	if len(errors) > 0 {
		return nil, errors
	}

	var allScripts = make(map[string]*cache.CacheGuard)

	maps.Copy(allScripts, initialScripts)

	// Resolve dynamic scripts from the initial scripts
	var resolvedDynamicScriptUrls = make(map[string]bool)

	for _, scriptData := range initialScripts {
		dynamicScriptUrls, errors := recursiveResolveDynamicScripts(assetPrefix, scriptData, initialScriptUrls, resolvedDynamicScriptUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		scriptDataMap, errors := fetchAllScripts(dynamicScriptUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		maps.Copy(allScripts, scriptDataMap)
	}

	return allScripts, nil
}

// FetchAndResolveAllSiteScripts takes the assetPrefix, the initial script URLs from the initial Next.js page data,
// and the list of all NextPageData, and returns a map of all script URLs to their content (as a string).
func FetchAndResolveAllSiteScripts(assetPrefix string, initialScriptUrls []string, buildManifest *types.BuildManifest) (map[string]*cache.CacheGuard, []error) {
	pages, errs := fetchAllNextPages(buildManifest)
	if len(errs) > 0 {
		glog.Errorf("Error fetching all Next.js pages: %v", errs)

		return nil, errs
	}

	scripts, errs := resolveAllSiteScripts(assetPrefix, initialScriptUrls, pages)
	if len(errs) > 0 {
		glog.Errorf("Error resolving all site scripts: %v", errs)

		return nil, errs
	}

	return scripts, nil
}
