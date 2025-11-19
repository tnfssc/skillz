package lockfile

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/mitchellh/mapstructure"
	"github.com/tnfssc/goon/pkg/toon"
)

// Lockfile represents the structure of skillz.lock
type Lockfile struct {
	Version  int                    `json:"lockfileVersion" toon:"lockfileVersion"`
	Packages map[string]LockPackage `json:"packages" toon:"packages"`
}

// LockPackage represents a locked dependency
type LockPackage struct {
	Version   string `json:"version,omitempty" toon:"version,omitempty"`
	Resolved  string `json:"resolved" toon:"resolved"`
	Integrity string `json:"integrity,omitempty" toon:"integrity,omitempty"`
	GitURL    string `json:"gitUrl,omitempty" toon:"gitUrl,omitempty"`
	GitRef    string `json:"gitRef,omitempty" toon:"gitRef,omitempty"`
	GitSHA    string `json:"gitSha,omitempty" toon:"gitSha,omitempty"`
}

// ReadLockfile reads and parses a lockfile from the given path
func ReadLockfile(path string) (*Lockfile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Decode TOON to map
	raw, err := toon.Decode(string(data), toon.DecodeOptions{})
	if err != nil {
		return nil, err
	}

	var lock Lockfile

	// Decode map to struct
	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		TagName:          "toon",
		WeaklyTypedInput: true,
		Result:           &lock,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create decoder: %w", err)
	}

	if err := decoder.Decode(raw); err != nil {
		return nil, fmt.Errorf("failed to decode lockfile: %w", err)
	}

	return &lock, nil
}

// WriteLockfile writes the lockfile to the given path
func WriteLockfile(path string, lock *Lockfile) error {
	// Convert struct to map[string]interface{} for TOON encoding
	// We use json.Marshal/Unmarshal to handle nested structs properly
	jsonData, err := json.Marshal(lock)
	if err != nil {
		return fmt.Errorf("failed to marshal lockfile to JSON: %w", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(jsonData, &m); err != nil {
		return fmt.Errorf("failed to unmarshal JSON to map: %w", err)
	}

	data, err := toon.Encode(m, toon.EncodeOptions{IndentSize: 2})
	if err != nil {
		return err
	}

	return os.WriteFile(path, []byte(data), 0644)
}
