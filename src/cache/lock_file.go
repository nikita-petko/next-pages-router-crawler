package cache

import (
	"os"
	"syscall"
)

type lockFile struct {
	file *os.File
}

// tryLock attempts to acquire an exclusive lock on the specified file path.
func tryLock(filePath string) (*lockFile, error) {
	// Create the lock file if it doesn't exist
	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_RDWR, 0666)
	if err != nil {
		return nil, err
	}

	// Try to acquire an exclusive lock on the file
	err = syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
	if err != nil {
		file.Close()

		return nil, err
	}

	return &lockFile{file: file}, nil
}

// Unlock releases the lock on the file and closes it.
func (lf *lockFile) Unlock() error {
	// Release the lock
	err := syscall.Flock(int(lf.file.Fd()), syscall.LOCK_UN)

	if err != nil {
		return err
	}

	err = lf.file.Close()
	if err != nil {
		return err
	}

	return os.Remove(lf.file.Name())
}
