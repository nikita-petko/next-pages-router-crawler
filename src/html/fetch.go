package html

import (
	"errors"
	"net/http"
	"net/url"

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

	resp, err := http.Get(pageUrl)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	html, err := gohtml.Parse(resp.Body)
	if err != nil {
		return nil, err
	}

	return getHtmlFromPageHtml(html)
}
