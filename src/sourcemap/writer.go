package sourcemap

import (
	"os"
	"path"

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

func writeSourceMapSourcesToOutput(sourceMap map[string]string) error {
	for sourceMappingFilePath, sourceContent := range sourceMap {
		resolvedOutputPath, err := resolveSourceMappingFilePathToOutputFilePath(sourceMappingFilePath)
		if err != nil {
			return err
		}

		// Make sure dir exists
		basePath := path.Dir(resolvedOutputPath)
		err = os.MkdirAll(basePath, os.ModePerm)
		if err != nil {
			return err
		}

		err = os.WriteFile(resolvedOutputPath, []byte(sourceContent), 0644)
		if err != nil {
			return err
		}

		glog.V(1000).Infof("Wrote source content to %s", resolvedOutputPath)
	}

	return nil
}

func writeAllSourceMaps(sourceMaps map[string]map[string]string) {
	for sourceMapUrl, sourceMap := range sourceMaps {
		glog.V(1000).Infof("Writing source map for %s", sourceMapUrl)

		err := writeSourceMapSourcesToOutput(sourceMap)
		if err != nil {
			glog.Warningf("Failed to write source map for %s: %v", sourceMapUrl, err)
		}
	}
}

// FetchAndWriteAllSourceMaps fetches all source maps for the given scripts and writes them to the output directory.
func FetchAndWriteAllSourceMaps(assetPrefix string, scripts map[string]*cache.CacheGuard) []error {
	sourceMaps, errs := fetchAllSourceMaps(assetPrefix, scripts)
	if len(errs) > 0 {
		return errs
	}

	parsedSourceMaps, errs := parseAllSourceMaps(sourceMaps)
	if len(errs) > 0 {
		return errs
	}

	writeAllSourceMaps(parsedSourceMaps)

	return nil
}
