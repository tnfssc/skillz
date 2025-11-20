package lockfile

import (
	"os"

	"github.com/tnfssc/goon/pkg/toon"
)

// Lockfile represents the structure of skillz.lock
type Lockfile struct {
	Version  int                    `toon:"lockfileVersion"`
	Packages map[string]LockPackage `toon:"packages"`
}

// LockPackage represents a locked dependency
type LockPackage struct {
	Version   string `toon:"version,omitempty"`
	Resolved  string `toon:"resolved"`
	Integrity string `toon:"integrity,omitempty"`
	GitURL    string `toon:"gitUrl,omitempty"`
	GitRef    string `toon:"gitRef,omitempty"`
	GitSHA    string `toon:"gitSha,omitempty"`
}

// ReadLockfile reads and parses a lockfile from the given path
func ReadLockfile(path string) (*Lockfile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var lock Lockfile
	if err := toon.Unmarshal(data, &lock, toon.DecodeOptions{IndentSize: 2}); err != nil {
		return nil, err
	}

	return &lock, nil
}

// WriteLockfile writes the lockfile to the given path
func WriteLockfile(path string, lock *Lockfile) error {
	data, err := toon.Marshal(lock, toon.EncodeOptions{IndentSize: 2})
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
