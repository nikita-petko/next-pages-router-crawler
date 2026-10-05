package cache

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path"
	"sync"

	"github.com/golang/glog"
	"github.vmminfra.dev/mfdlabs/next-pages-router-crawler/flags"
)

var (
	hashMapLock = sync.RWMutex{}

	// map of abs file path to sha256 hash
	hashMap = make(map[string]string)
)

func recursivelyReadDirectory(dirPath string) ([]string, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	var filePaths []string
	for _, entry := range entries {
		if entry.IsDir() {
			subDirPath := path.Join(dirPath, entry.Name())
			subDirFiles, err := recursivelyReadDirectory(subDirPath)
			if err != nil {
				return nil, err
			}

			filePaths = append(filePaths, subDirFiles...)
		} else {
			filePath := path.Join(dirPath, entry.Name())
			filePaths = append(filePaths, filePath)
		}
	}

	return filePaths, nil
}

func computeFileHash(filePath string) (string, error) {
	// Open the file for reading
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}

	defer file.Close()

	// Create a new MD5 hash
	hash := md5.New()

	// Copy the file content into the hash
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	// Return the hexadecimal representation of the hash
	return hex.EncodeToString(hash.Sum(nil)), nil
}

// initializeHashMap initializes the hash map with existing cache files and their corresponding hashes.
func initializeHashMap() error {
	glog.Infof("Initializing hash map from cache path: %s", *flags.CachePath)

	if !*flags.ShouldInitializeHashMap {
		return nil
	}

	// First try and load a cached hash map so we don't have to recompute hashes for unchanged files.
	hashFile := path.Join(*flags.CachePath, "hashes.json")
	if _, err := os.Stat(hashFile); err == nil {
		glog.Infof("Loading cached hash map from %s", hashFile)

		// Load the cached hash map from the JSON file
		data, err := os.ReadFile(hashFile)
		if err != nil {
			return err
		}

		err = json.Unmarshal(data, &hashMap)
		if err != nil {
			return err
		}

		return nil
	}

	files, err := recursivelyReadDirectory(*flags.CachePath)
	if err != nil {
		return err
	}

	glog.Infof("No cached hash map found, computing hashes for %d existing cache files.", len(files))

	for _, file := range files {
		if path.Ext(file) == ".lock" || path.Ext(file) == ".build" {
			continue
		}

		hash, err := computeFileHash(file)
		if err != nil {
			return err
		}

		hashMap[file] = hash
	}

	// Save the computed hash map to the JSON file for future use.
	data, err := json.Marshal(hashMap)
	if err != nil {
		return err
	}

	err = os.WriteFile(hashFile, data, 0644)
	if err != nil {
		return err
	}

	return nil
}

func isFileCachedByHash(headResp *http.Response, resolvedPath string) bool {
	hashMapLock.RLock()
	defer hashMapLock.RUnlock()

	hash, exists := hashMap[resolvedPath]
	if !exists {
		return false
	}

	// Compare the ETag header with the cached hash
	etag := headResp.Header.Get("ETag")

	// Determine if weak ETag
	if len(etag) > 0 && etag[0] == 'W' {
		// Remove the weak prefix and quotes for comparison
		etag = etag[2 : len(etag)-1]
	}

	// Extract the hash from the ETag header (remove quotes)
	if len(etag) > 0 && etag[0] == '"' && etag[len(etag)-1] == '"' {
		etag = etag[1 : len(etag)-1]
	}

	return hash == etag
}

func writeFileAndUpdateHashMap(resolvedPath string, data []byte) error {
	// Ensure directory exists
	dir := path.Dir(resolvedPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return err
	}

	// Write the data to the file
	if err := os.WriteFile(resolvedPath, data, 0644); err != nil {
		return err
	}

	// Compute the hash of the written file
	hash, err := computeFileHash(resolvedPath)
	if err != nil {
		return err
	}

	hashMapLock.Lock()
	defer hashMapLock.Unlock()

	// Update the hash map with the new hash
	hashMap[resolvedPath] = hash

	return nil
}

func persistHashMap() error {
	hashMapLock.RLock()
	defer hashMapLock.RUnlock()

	hashFile := path.Join(*flags.CachePath, "hashes.json")
	data, err := json.Marshal(hashMap)
	if err != nil {
		return err
	}

	err = os.WriteFile(hashFile, data, 0644)
	if err != nil {
		return err
	}

	return nil
}
