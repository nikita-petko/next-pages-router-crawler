package sourcemap

import (
	"os"
	"path"
	"sort"
	"strings"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/cache"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

// SetupOutput checks if the output path is provided and creates the output directory if it doesn't exist.
// It logs a fatal error if the output path is not provided or if the directory creation fails.
func SetupOutput() {
	if *flags.OutputPath == "" {
		glog.Fatalf("Output path is required. Please provide a valid output path using the --output-path flag or the OUTPUT_PATH environment variable.")
	}

	if *flags.ClearOutput {
		err := os.RemoveAll(*flags.OutputPath)
		if err != nil {
			glog.Fatalf("Failed to clear output directory: %v", err)
		}
	}

	// Create the output directory if it doesn't exist
	err := os.MkdirAll(*flags.OutputPath, os.ModePerm)
	if err != nil {
		glog.Fatalf("Failed to create output directory: %v", err)
	}
}

func writeSourceMapSourcesToOutput(sourceMap map[string]string) {
	for sourceMappingFilePath, sourceContent := range sourceMap {
		resolvedOutputPath, err := resolveSourceMappingFilePathToOutputFilePath(sourceMappingFilePath)
		if err != nil {
			glog.V(100).Infof("Failed to resolve source mapping file path %s: %v", sourceMappingFilePath, err)

			continue
		}

		// Make sure dir exists
		basePath := path.Dir(resolvedOutputPath)
		err = os.MkdirAll(basePath, os.ModePerm)
		if err != nil {
			glog.V(100).Infof("Failed to create directory %s: %v", basePath, err)

			continue
		}

		err = os.WriteFile(resolvedOutputPath, []byte(sourceContent), 0644)
		if err != nil {
			glog.V(100).Infof("Failed to write source content to %s: %v", resolvedOutputPath, err)

			continue
		}

		glog.V(1000).Infof("Wrote source content to %s", resolvedOutputPath)
	}
}

func writeAllSourceMaps(sourceMaps map[string]map[string]string) {
	for sourceMapUrl, sourceMap := range sourceMaps {
		glog.V(1000).Infof("Writing source map for %s", sourceMapUrl)

		writeSourceMapSourcesToOutput(sourceMap)
	}
}

func sortByDeepestPathFirst(sourceMaps map[string]map[string]string) (sortedMap map[string]map[string]string) {
	// Sort the source file names of each source map by the deepest path first to ensure that nested source maps are processed before their parents.
	sortedMap = make(map[string]map[string]string, len(sourceMaps))

	for sourceMapUrl, sourceMap := range sourceMaps {
		sortedSourceMap := make(map[string]string, len(sourceMap))

		// Sort the source file names by the deepest path first
		sortedSourceFileNames := make([]string, 0, len(sourceMap))
		for sourceFileName := range sourceMap {
			sortedSourceFileNames = append(sortedSourceFileNames, sourceFileName)
		}

		sort.Slice(sortedSourceFileNames, func(i, j int) bool {
			return strings.Count(sortedSourceFileNames[i], "/") > strings.Count(sortedSourceFileNames[j], "/")
		})

		for _, sourceFileName := range sortedSourceFileNames {
			sortedSourceMap[sourceFileName] = sourceMap[sourceFileName]
		}

		sortedMap[sourceMapUrl] = sortedSourceMap
	}

	return sortedMap
}

// handleFileToDirectoryNameResolution handles cases where a nested path exists, and a file
// also exists that is a part of that path.
// For example, if we have a file at "a/b/c.js" and a directory at "a/b/c.js/d.js", we need to rename the file to "a/b/c.js [file]" to avoid conflicts.
func handleFileToDirectoryNameResolutions(sourceMaps map[string]map[string]string) (resolvedSourceMaps map[string]map[string]string) {
	resolvedSourceMaps = make(map[string]map[string]string, len(sourceMaps))

	for sourceMapUrl, sourceMap := range sourceMaps {
		resolvedSourceMap := make(map[string]string, len(sourceMap))

		for sourceMappingFilePath, sourceContent := range sourceMap {
			// Check if the sourceMappingFilePath is a prefix of any other sourceMappingFilePath in the same sourceMap
			isPrefix := false
			for otherSourceMappingFilePath := range sourceMap {
				if sourceMappingFilePath != otherSourceMappingFilePath && strings.HasPrefix(otherSourceMappingFilePath, sourceMappingFilePath+"/") {
					isPrefix = true
					break
				}
			}

			if isPrefix {
				glog.V(1000).Infof("Renaming source mapping file path %s to avoid conflicts with nested paths", sourceMappingFilePath)

				// Rename the sourceMappingFilePath to avoid conflicts
				resolvedSourceMappingFilePath := sourceMappingFilePath + " [file]"
				resolvedSourceMap[resolvedSourceMappingFilePath] = sourceContent
			} else {
				resolvedSourceMap[sourceMappingFilePath] = sourceContent
			}
		}

		resolvedSourceMaps[sourceMapUrl] = resolvedSourceMap
	}

	return resolvedSourceMaps
}

// FetchAndWriteAllSourceMaps fetches all source maps for the given assets and writes them to the output directory.
func FetchAndWriteAllSourceMaps(assetPrefix string, assets map[string]*cache.CacheGuard) (map[string]*cache.CacheGuard, []error) {
	sourceMaps, errs := fetchAllSourceMaps(assetPrefix, assets)
	if len(errs) > 0 {
		return nil, errs
	}

	parsedSourceMaps, errs := parseAllSourceMaps(sourceMaps)
	if len(errs) > 0 {
		return nil, errs
	}

	fullSourceMaps := handleFileToDirectoryNameResolutions(sortByDeepestPathFirst(parsedSourceMaps))

	writeAllSourceMaps(fullSourceMaps)

	return sourceMaps, nil
}
