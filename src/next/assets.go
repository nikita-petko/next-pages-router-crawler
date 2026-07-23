package next

import (
	goerrors "errors"
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

func isIgnoredAssetUrl(assetUrl string) bool {
	for _, ignoredAsset := range ignoredAssets {
		if strings.HasSuffix(assetUrl, ignoredAsset) {
			return true
		}
	}
	return false
}

// getAllNextAssetUrls gets all URLs from all script and style tags in the provided HTML head node and returns them as a slice of strings.
func getAllNextAssetUrls(assetPrefix string, htmlHead *gohtml.Node) ([]string, error) {
	scriptTags := html.GetAllElementsOfType("script", htmlHead)
	styleTags := html.GetAllElementsOfType("link", htmlHead)

	if len(scriptTags) == 0 {
		return nil, goerrors.New("html head contained no script tags!")
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
	var assetUrls []string

SCRIPTS:
	for _, scriptTag := range scriptTags {
		for _, attr := range scriptTag.Attr {
			if attr.Key == "src" {
				scriptUrl := attr.Val

				if isIgnoredAssetUrl(scriptUrl) {
					continue SCRIPTS
				}

				// Only include scripts that start with the next.js prefix
				if strings.HasPrefix(scriptUrl, nextPrefixedUrl) {
					// For non-prefixed urls prepend the baseUrl
					if assetPrefix == "" {
						scriptUrl = fmt.Sprintf("%s%s", baseUrl, scriptUrl)
					}

					assetUrls = append(assetUrls, scriptUrl)
				}

				break
			}
		}
	}

STYLES:
	for _, styleTag := range styleTags {
		for _, attr := range styleTag.Attr {
			if attr.Key == "href" {
				styleUrl := attr.Val

				if isIgnoredAssetUrl(styleUrl) {
					continue STYLES
				}

				// Only include styles that start with the next.js prefix
				if strings.HasPrefix(styleUrl, nextPrefixedUrl) {
					// For non-prefixed urls prepend the baseUrl
					if assetPrefix == "" {
						styleUrl = fmt.Sprintf("%s%s", baseUrl, styleUrl)
					}

					assetUrls = append(assetUrls, styleUrl)
				}

				break
			}
		}
	}

	if len(assetUrls) == 0 {
		return nil, fmt.Errorf("html head contained no script or link tags with a src/href attribute starting with '%s'!", nextPrefixedUrl)
	}

	return assetUrls, nil
}

// getAllUniquePageAssets gets all unique asset URLs from the provided NextPageData list
// This does not include any dynamically fetched (at runtime) assets
func getAllUniquePageAssets(initialPageAssetUrls []string, pages []*types.NextPageData) ([]string, error) {
	var assetUrls []string

	for _, page := range pages {
		assetUrls = append(assetUrls, page.AssetUrls...)
	}

	assetUrls = append(assetUrls, initialPageAssetUrls...)

	// Remove duplicates
	slices.Sort(assetUrls)
	assetUrls = slices.Compact(assetUrls)

	return assetUrls, nil
}

func isValidChunkDataType(contentType string) bool {
	return strings.HasPrefix(contentType, "text/javascript") ||
		strings.HasPrefix(contentType, "application/javascript") ||
		strings.HasPrefix(contentType, "text/css") ||
		strings.HasPrefix(contentType, "application/json")
}

var notFoundError = goerrors.New("404 Not Found")

// fetchAllAssets fetches the content of all assets from the provided asset URLs and returns a map of asset URL to asset content (as a byte slice).
func fetchAllAssets(assetUrls []string) (map[string]*cache.CacheGuard, []error) {
	waitGroup := &sync.WaitGroup{}
	lock := &sync.Mutex{}
	errorsLock := &sync.Mutex{}

	waitGroup.Add(len(assetUrls))

	var assetDataMap = make(map[string]*cache.CacheGuard)
	var errors []error

	for _, assetUrl := range assetUrls {
		go func(assetUrl string) {
			defer waitGroup.Done()

			glog.V(1000).Infof("Fetching asset: %s", assetUrl)

			cached, err := cache.CacheGuardedHttpGet(assetUrl, func(resp *http.Response) error {
				if resp.StatusCode == http.StatusNotFound {
					return notFoundError
				}

				if !isValidChunkDataType(resp.Header.Get("Content-Type")) {
					return fmt.Errorf("failed to fetch asset %s: status code %d, content type %s", assetUrl, resp.StatusCode, resp.Header.Get("Content-Type"))
				}

				return nil
			})
			if err != nil {
				if goerrors.Is(err, notFoundError) {
					glog.V(100).Infof("Asset not found (404): %s", assetUrl)

					return // Skip adding to errors if the asset was not found (404)
				}

				errorsLock.Lock()
				defer errorsLock.Unlock()

				errors = append(errors, err)

				return
			}

			lock.Lock()
			defer lock.Unlock()

			assetDataMap[assetUrl] = cached
		}(assetUrl)
	}

	waitGroup.Wait()

	return assetDataMap, errors
}

// resolveDynamicAssetsFromBundle takes the assetPrefix,
// the asset data (as a cached data),
// and the existing asset URLs,
// and returns a slice of dynamic asset URLs that are found in the asset data but
// not already in the existing asset URLs.
func resolveDynamicAssetsFromBundle(assetPrefix string, assetDataCached *cache.CacheGuard, existingAssetUrls []string) ([]string, error) {
	assetData, err := assetDataCached.Get()
	if err != nil {
		return nil, err
	}

	matches := regexp.MustCompile(dynamicImportRegex).FindAllString(string(assetData), -1)
	if matches == nil {
		return []string{}, nil
	}

	baseUrl, err := url.GetBaseUrl(assetPrefix)
	if err != nil {
		return nil, err
	}

	var dynamicAssetUrls []string

	for _, match := range matches {
		dynamicAssetUrl := fmt.Sprintf("%s/_next/%s", baseUrl, match)

		// Only include the dynamic asset if it is not already in the existing asset URLs
		if !slices.Contains(existingAssetUrls, dynamicAssetUrl) {
			dynamicAssetUrls = append(dynamicAssetUrls, dynamicAssetUrl)
		}
	}

	return dynamicAssetUrls, nil
}

// recursiveResolveDynamicAssets takes the assetPrefix, the asset data (as a string),
// the existing asset URLs, and a map of already resolved dynamic asset URLs,
// and returns a slice of all dynamic asset URLs that are found in the asset data but
// not already in the existing asset URLs or the already resolved dynamic asset URLs.
//
// This function is recursive,
// meaning it will continue to resolve dynamic asset from the newly found dynamic asset
// until no new dynamic assets are found.
func recursiveResolveDynamicAssets(assetPrefix string, assetDataCached *cache.CacheGuard, existingAssetUrls []string, resolvedDynamicAssetUrls map[string]bool) ([]string, []error) {
	dynamicAssetUrls, err := resolveDynamicAssetsFromBundle(assetPrefix, assetDataCached, existingAssetUrls)
	if err != nil {
		return nil, []error{err}
	}

	var newDynamicAssetUrls []string

	for _, dynamicAssetUrl := range dynamicAssetUrls {
		if !resolvedDynamicAssetUrls[dynamicAssetUrl] {
			resolvedDynamicAssetUrls[dynamicAssetUrl] = true
			newDynamicAssetUrls = append(newDynamicAssetUrls, dynamicAssetUrl)
		}
	}

	if len(newDynamicAssetUrls) == 0 {
		return []string{}, nil
	}

	assetDataMap, errors := fetchAllAssets(newDynamicAssetUrls)
	if len(errors) > 0 {
		return nil, errors
	}

	for _, dynamicAssetUrl := range newDynamicAssetUrls {
		assetData := assetDataMap[dynamicAssetUrl]
		if assetData == nil {
			continue // Skip nil
		}

		// Recursively resolve dynamic assets from the newly found dynamic asset
		recursivelyResolvedDynamicAssetUrls, errors := recursiveResolveDynamicAssets(assetPrefix, assetData, existingAssetUrls, resolvedDynamicAssetUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		newDynamicAssetUrls = append(newDynamicAssetUrls, recursivelyResolvedDynamicAssetUrls...)
	}

	return newDynamicAssetUrls, nil
}

// resolveAllSiteAssets takes the assetPrefix, the initial asset URLs from the initial Next.js page data,
// and the list of all NextPageData, and returns a map of all asset URLs to their content (as a string).
func resolveAllSiteAssets(assetPrefix string, initialPageAssetUrls []string, pages []*types.NextPageData) (map[string]*cache.CacheGuard, []error) {
	initialAssetUrls, err := getAllUniquePageAssets(initialPageAssetUrls, pages)
	if err != nil {
		return nil, []error{err}
	}

	// Initial assets fetch
	initialAssets, errors := fetchAllAssets(initialAssetUrls)
	if len(errors) > 0 {
		return nil, errors
	}

	var allAssets = make(map[string]*cache.CacheGuard)
	maps.Copy(allAssets, initialAssets)

	// Resolve dynamic assets from the initial assets
	var resolvedDynamicAssetUrls = make(map[string]bool)

	for _, assetData := range initialAssets {
		dynamicAssetUrls, errors := recursiveResolveDynamicAssets(assetPrefix, assetData, initialAssetUrls, resolvedDynamicAssetUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		assetDataMap, errors := fetchAllAssets(dynamicAssetUrls)
		if len(errors) > 0 {
			return nil, errors
		}

		maps.Copy(allAssets, assetDataMap)
	}

	return allAssets, nil
}

// FetchAndResolveAllSiteAssets takes the assetPrefix, the initial asset URLs from the initial Next.js page data,
// and the list of all NextPageData, and returns a map of all asset URLs to their content (as a string).
func FetchAndResolveAllSiteAssets(assetPrefix string, initialAssetUrls []string, buildManifest *types.BuildManifest) (map[string]*cache.CacheGuard, []error) {
	pages, errs := fetchAllNextPages(buildManifest)
	if len(errs) > 0 {
		glog.Errorf("Error fetching all Next.js pages: %v", errs)

		return nil, errs
	}

	assets, errs := resolveAllSiteAssets(assetPrefix, initialAssetUrls, pages)
	if len(errs) > 0 {
		glog.Errorf("Error resolving all site assets: %v", errs)

		return nil, errs
	}

	return assets, nil
}
