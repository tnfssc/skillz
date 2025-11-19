package auth

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/mitchellh/mapstructure"
	"github.com/tnfssc/goon/pkg/toon"
)

type Credentials struct {
	Token    string `toon:"token"`
	Username string `toon:"username"`
}

func GetCredentialsPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillz", "credentials.toon"), nil
}

func SaveCredentials(creds Credentials) error {
	path, err := GetCredentialsPath()
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}

	// Convert struct to map[string]interface{} for TOON encoding
	jsonData, err := json.Marshal(creds)
	if err != nil {
		return fmt.Errorf("failed to marshal credentials to JSON: %w", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(jsonData, &m); err != nil {
		return fmt.Errorf("failed to unmarshal JSON to map: %w", err)
	}

	data, err := toon.Encode(m, toon.EncodeOptions{IndentSize: 2})
	if err != nil {
		return err
	}

	return os.WriteFile(path, []byte(data), 0600)
}

func LoadCredentials() (*Credentials, error) {
	path, err := GetCredentialsPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	// Decode TOON to map
	raw, err := toon.Decode(string(data), toon.DecodeOptions{})
	if err != nil {
		return nil, err
	}

	var creds Credentials

	// Decode map to struct
	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		TagName:          "toon",
		WeaklyTypedInput: true,
		Result:           &creds,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create decoder: %w", err)
	}

	if err := decoder.Decode(raw); err != nil {
		return nil, fmt.Errorf("failed to decode credentials: %w", err)
	}

	return &creds, nil
}

func Logout() error {
	path, err := GetCredentialsPath()
	if err != nil {
		return err
	}
	return os.Remove(path)
}
