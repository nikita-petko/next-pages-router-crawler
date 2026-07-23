package html

import (
	"errors"

	gohtml "golang.org/x/net/html"
)

// GetHeadHTML searches for the <body> element in the provided HTML document and returns it as a gohtml.Node.
func GetHeadHTML(htmlNodes *gohtml.Node) (*gohtml.Node, error) {
	if head := GetFirstElementOfType("head", htmlNodes); head != nil {
		return head, nil
	}

	return nil, errors.New("unable to find body element in HTML document!")
}
