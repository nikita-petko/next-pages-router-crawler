package next

import (
	"fmt"
	"slices"
	"sync"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/html"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/url"
)

// FetchNextPageData fetches the Next.js page data for the given URL, including the NextData and all script URLs.
func FetchNextPageData(url string) (nextData *types.NextData, scriptUrls []string, err error) {
	glog.Infof("Fetching Next.js page data for URL: %s", url)

	htmlData, err := html.FetchHTMLForPage(url)
	if err != nil {
		return
	}

	head, err := html.GetHeadHTML(htmlData)
	if err != nil {
		return
	}

	body, err := html.GetBodyHTML(htmlData)
	if err != nil {
		return
	}

	nextData, err = getNextData(body)
	if err != nil {
		return
	}

	scriptUrls, err = getAllNextScriptUrls(nextData.AssetPrefix, head)
	if err != nil {
		return
	}

	return
}

func buildUrlForPage(page string) (string, error) {
	baseUrl, err := url.GetBaseUrl("") // Needs no assetprefix, as the base URL is the same for all pages.
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%s", baseUrl, page), nil
}

// FetchAllNextPages fetches all the Next.js page data for the given build manifest, including the NextData and all script URLs for each page.
func FetchAllNextPages(buildManifest *types.BuildManifest) ([]*types.NextPageData, []error) {
	filteredPages := slices.DeleteFunc(buildManifest.SortedPages, func(page string) bool {
		return slices.Contains(ignorePages, page)
	})

	waitGroup := sync.WaitGroup{}
	lock := sync.Mutex{}
	errLock := sync.Mutex{}

	waitGroup.Add(len(filteredPages))

	var nextPages []*types.NextPageData
	var errors []error

	for _, page := range filteredPages {
		url, err := buildUrlForPage(page)
		if err != nil {
			errLock.Lock()
			defer errLock.Unlock()

			errors = append(errors, err)

			continue
		}

		go func() {
			defer waitGroup.Done()

			nextData, scriptUrls, err := FetchNextPageData(url)
			if err != nil {
				errLock.Lock()
				defer errLock.Unlock()

				errors = append(errors, err)

				return
			}

			lock.Lock()
			defer lock.Unlock()

			nextPages = append(nextPages, &types.NextPageData{NextData: nextData, ScriptUrls: scriptUrls})
		}()
	}

	waitGroup.Wait()

	return nextPages, errors
}
