package lockfile

import (
	"os"

	"gopkg.in/yaml.v3"
)

// Lockfile represents the structure of skillz.lock
type Lockfile struct {
	Version  int                    `yaml:"lockfileVersion"`
	Packages map[string]LockPackage `yaml:"packages"`
}

// LockPackage represents a locked dependency
type LockPackage struct {
	Version   string `yaml:"version,omitempty"`
	Resolved  string `yaml:"resolved"`
	Integrity string `yaml:"integrity,omitempty"`
	GitURL    string `yaml:"gitUrl,omitempty"`
	GitRef    string `yaml:"gitRef,omitempty"`
	GitSHA    string `yaml:"gitSha,omitempty"`
}

// ReadLockfile reads and parses a lockfile from the given path
func ReadLockfile(path string) (*Lockfile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var lock Lockfile
	if err := yaml.Unmarshal(data, &lock); err != nil {
		return nil, err
	}

	return &lock, nil
}

// WriteLockfile writes the lockfile to the given path
func WriteLockfile(path string, lock *Lockfile) error {
	data, err := yaml.Marshal(lock)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
