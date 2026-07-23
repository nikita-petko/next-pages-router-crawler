package html

import (
	"encoding/json"
	"fmt"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
	gohtml "golang.org/x/net/html"
)

func recursiveFindNextDataScript(n *gohtml.Node) *gohtml.Node {
	if n.Type == gohtml.ElementNode && n.Data == "script" {
		for _, attr := range n.Attr {
			if attr.Key == "id" && attr.Val == NextDataScriptId {
				return n
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if node := recursiveFindNextDataScript(c); node != nil {
			return node
		}
	}

	return nil
}

// GetNextData extracts the NextData from the HTML document by searching for the script tag with the id "__NEXT_DATA__".
func GetNextData(htmlBody *gohtml.Node) (*types.NextData, error) {
	// Find the first script element with the id
	nextDataScript := recursiveFindNextDataScript(htmlBody)
	if nextDataScript == nil {
		return nil, fmt.Errorf("unable to find script tag with id of '%s' in page!", NextDataScriptId)
	}

	nextData := &types.NextData{}
	if err := json.Unmarshal([]byte(nextDataScript.FirstChild.Data), nextData); err != nil {
		return nil, err
	}

	return nextData, nil
}
