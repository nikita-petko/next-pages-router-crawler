package sourcemap

import (
	"fmt"
	gourl "net/url"
	"path"
	"regexp"
	"strings"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/url"
)

func resolveSourceMapUrlsFromScript(baseUrl string, scriptDataCached *cache.CacheGuard) ([]string, error) {
	scriptData, err := scriptDataCached.Get()
	if err != nil {
		return nil, err
	}

	matches := regexp.MustCompile(sourceMappingUrlRegex).FindAllStringSubmatch(string(scriptData), -1)
	if matches == nil {
		return nil, nil
	}

	var sourceMapUrls []string
	for _, match := range matches {
		if len(match) > 1 {
			// Determine if relative or absolute
			sourceMapUrl := match[1]

			if !regexp.MustCompile(`^https?://`).MatchString(sourceMapUrl) {
				// If relative, prepend baseUrl
				sourceMapUrl = fmt.Sprintf("%s%s", baseUrl, sourceMapUrl)
			}

			sourceMapUrls = append(sourceMapUrls, sourceMapUrl)
		}
	}

	return sourceMapUrls, nil
}

func resolveSourceMapUrls(assetPrefix string, sources map[string]*cache.CacheGuard) (map[string][]string, error) {
	baseUrl, err := url.GetBaseUrl(assetPrefix)
	if err != nil {
		return nil, err
	}

	sourceMapUrlsMap := make(map[string][]string)
	for scriptUrl, scriptData := range sources {
		url, err := gourl.Parse(scriptUrl)
		if err != nil {
			return nil, err
		}

		path := strings.TrimSuffix(url.Path, url.Path[strings.LastIndex(url.Path, "/")+1:])

		if assetPrefix != "" {
			assetPrefixUrl, err := gourl.Parse(assetPrefix)
			if err != nil {
				return nil, err
			}

			// Remove the assetPrefix from the path if it exists
			if after, ok := strings.CutPrefix(path, assetPrefixUrl.Path); ok {
				path = after
			}
		}

		baseUrl := fmt.Sprintf("%s%s", baseUrl, path)

		sourceMapUrls, err := resolveSourceMapUrlsFromScript(baseUrl, scriptData)
		if err != nil {
			return nil, err
		}

		if len(sourceMapUrls) > 0 {
			sourceMapUrlsMap[scriptUrl] = sourceMapUrls
		}
	}

	return sourceMapUrlsMap, nil
}

func resolveSourceMappingFilePathToOutputFilePath(sourceMappingFilePath string) (string, error) {
	// Remove webpack or turbopack prefix
	sourceMappingFilePath = strings.TrimPrefix(sourceMappingFilePath, webpackPrefix)
	sourceMappingFilePath = strings.TrimPrefix(sourceMappingFilePath, turboPrefix)

	uri, err := gourl.Parse(*flags.Url)
	if err != nil {
		return "", err
	}

	return path.Join(*flags.OutputPath, uri.Host, sourceMappingFilePath), nil
}
