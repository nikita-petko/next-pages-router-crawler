package next

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/dop251/goja"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/next/types"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/url"
)

const BuildManifestJsonScriptFormat = `
self = {};
%s;
JSON.stringify(self.__BUILD_MANIFEST)
`

func buildManifestUrl(nextData *types.NextData) (string, error) {
	baseUrl, err := url.GetBaseUrl(nextData.AssetPrefix)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/_next/static/%s/%s", baseUrl, nextData.BuildId, BuildManifestScript), nil
}

func toStringSlice(slice []any) []string {
	result := make([]string, len(slice))

	for i, v := range slice {
		result[i] = fmt.Sprintf("%v", v)
	}

	return result
}

// getBuildManifest fetches the build manifest for the given NextData,
// which contains information about all the pages and their corresponding chunk files.
func getBuildManifest(nextData *types.NextData) (*types.BuildManifest, error) {
	manifestUrl, err := buildManifestUrl(nextData)
	if err != nil {
		return nil, err
	}

	resp, err := http.Get(manifestUrl)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	body := string(bodyBytes)

	vm := goja.New()
	v, err := vm.RunString(fmt.Sprintf(BuildManifestJsonScriptFormat, body))
	if err != nil {
		return nil, err
	}

	result, ok := v.Export().(string)
	if !ok {
		return nil, errors.New("failed to parse result from buildManifest as a string!")
	}

	buildManifest := &types.BuildManifest{}

	var manifestData map[string]any
	err = json.Unmarshal([]byte(result), &manifestData)
	if err != nil {
		return nil, err
	}

	buildManifest.SortedPages = toStringSlice(manifestData["sortedPages"].([]any))

	// Filter the map out for keys present in sortedPages
	buildManifest.PageChunks = make(map[string][]string)

	for _, page := range buildManifest.SortedPages {
		pageChunksData, ok := manifestData[page]
		if !ok {
			continue // Skip over non existing pages
		}

		buildManifest.PageChunks[page] = toStringSlice(pageChunksData.([]any))
	}

	return buildManifest, nil
}
