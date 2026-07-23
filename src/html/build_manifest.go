package html

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

	return fmt.Sprintf("%s/_next/static/%s/%s", baseUrl, nextData.BuildId, BuildManifestJavaScriptFileName), nil
}

func GetBuildManifest(nextData *types.NextData) (*types.BuildManifest, error) {
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
	err = json.Unmarshal([]byte(result), buildManifest)
	if err != nil {
		return nil, err
	}

	return buildManifest, nil
}
