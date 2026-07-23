package cache

import (
	"errors"
	gourl "net/url"
	"os"
	"path"

	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

// ReadBuildId reads the build ID from the .build file in the cache directory.
// If the file does not exist, it returns an empty string and no error.
func ReadBuildId(url string) (string, error) {
	uri, err := gourl.Parse(url)
	if err != nil {
		return "", err
	}

	bytes, err := os.ReadFile(path.Join(*flags.CachePath, uri.Host, uri.Path, ".build"))
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return "", err
	}

	return string(bytes), nil
}

// WriteBuildId writes the given build ID to the .build file in the cache directory.
func WriteBuildId(url, buildId string) error {
	uri, err := gourl.Parse(url)
	if err != nil {
		return err
	}

	return os.WriteFile(path.Join(*flags.CachePath, uri.Host, uri.Path, ".build"), []byte(buildId), 0666)
}
