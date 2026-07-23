package html

import (
	"errors"

	gohtml "golang.org/x/net/html"
)

// GetBodyHTML searches for the <body> element in the provided HTML document and returns it as a gohtml.Node.
func GetBodyHTML(htmlNodes *gohtml.Node) (*gohtml.Node, error) {
	if body := GetFirstElementOfType("body", htmlNodes); body != nil {
		return body, nil
	}

	return nil, errors.New("unable to find body element in HTML document!")
}
