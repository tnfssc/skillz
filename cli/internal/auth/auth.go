package auth

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Credentials struct {
	Token    string `json:"token"`
	Username string `json:"username"`
}

func GetCredentialsPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".skillz", "credentials.json"), nil
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

	data, err := json.MarshalIndent(creds, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0600)
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

	var creds Credentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, err
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
