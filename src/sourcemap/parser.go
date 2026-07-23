package sourcemap

import (
	"encoding/json"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/sourcemap/types"
)

func parseSourceMap(sourceMapDataCached *cache.CacheGuard) (map[string]string, error) {
	sourceMapData, err := sourceMapDataCached.Get()
	if err != nil {
		return nil, err
	}

	var sourceMapDataJson types.SourceMap
	err = json.Unmarshal(sourceMapData, &sourceMapDataJson)
	if err != nil {
		return nil, err
	}

	sourceMap := make(map[string]string)

	// Prioritize the "sections" field if it exists, otherwise use the "sources" and "sourcesContent" fields
	if len(sourceMapDataJson.Sections) > 0 {
		for _, section := range sourceMapDataJson.Sections {
			for i, source := range section.Map.Sources {
				if i < len(section.Map.SourcesContent) {
					sourceMap[source] = section.Map.SourcesContent[i]
				}
			}
		}
	} else {
		for i, source := range sourceMapDataJson.Sources {
			if i < len(sourceMapDataJson.SourcesContent) {
				sourceMap[source] = sourceMapDataJson.SourcesContent[i]
			}
		}
	}

	return sourceMap, nil
}

func parseAllSourceMaps(sourceMaps map[string]*cache.CacheGuard) (map[string]map[string]string, []error) {
	sourceMapsParsed := make(map[string]map[string]string)

	var errors []error

	for sourceMapUrl, sourceMapDataCached := range sourceMaps {
		if sourceMapDataCached == nil {
			continue
		}

		sourceMapParsed, err := parseSourceMap(sourceMapDataCached)
		if err != nil {
			errors = append(errors, err)
			continue
		}

		sourceMapsParsed[sourceMapUrl] = sourceMapParsed
	}

	return sourceMapsParsed, errors
}
