package html

import (
	"bytes"
	"errors"
	"net/url"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	gohtml "golang.org/x/net/html"
)

func getHtmlFromPageHtml(nodes *gohtml.Node) (*gohtml.Node, error) {
	if html := GetFirstElementOfType("html", nodes); html != nil {
		return html, nil
	}

	return nil, errors.New("unable to find html element in HTML document!")
}

// FetchHTMLForPage fetches the HTML document for the given page URL and returns it as a gohtml.Node.
func FetchHTMLForPage(pageUrl string) (*gohtml.Node, error) {
	_, err := url.Parse(pageUrl)
	if err != nil {
		return nil, err
	}

	cached, err := cache.CacheGuardedHttpGet(pageUrl, nil)
	if err != nil {
		return nil, err
	}

	data, err := cached.Get()
	if err != nil {
		return nil, err
	}

	html, err := gohtml.Parse(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	return getHtmlFromPageHtml(html)
}
