package html

import gohtml "golang.org/x/net/html"

// GetFirstElementOfType searches for the first element of the specified type in the provided HTML node and returns it as a gohtml.Node.
func GetFirstElementOfType(t string, n *gohtml.Node) *gohtml.Node {
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if c.Type == gohtml.ElementNode && c.Data == t {
			return c
		}
	}

	return nil
}

// GetAllElementsOfType searches for all elements of the specified type in the provided HTML node and returns them as a slice of gohtml.Node pointers.
func GetAllElementsOfType(t string, n *gohtml.Node) []*gohtml.Node {
	var elements []*gohtml.Node

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if c.Type == gohtml.ElementNode && c.Data == t {
			elements = append(elements, c)
		}
	}

	return elements
}
