package types

// NextPageData contains next data and asset urls from a Next.js page.
// It is sourced from the HTML of the page and is used to determine the order of crawling for the pages in the application.
type NextPageData struct {
	// NextData contains the needed data from the Next.js page data in the Next.js application.
	NextData *NextData

	// AssetUrls contains the list of all the asset URLs in the Next.js application.
	AssetUrls []string
}
