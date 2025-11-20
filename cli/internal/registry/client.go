package registry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const DefaultRegistryURL = "http://localhost:8787/api/v1"

// GetRegistryURL returns the registry URL, checking environment variable first
func GetRegistryURL() string {
	if url := os.Getenv("SKILLZ_REGISTRY_URL"); url != "" {
		return url
	}
	return DefaultRegistryURL
}

// Client represents an API client for the skillz registry
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = GetRegistryURL()
	}
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type SkillResponse struct {
	Skill    SkillMeta     `json:"skill"`
	Versions []VersionMeta `json:"versions"`
}

type SkillMeta struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Author      string `json:"author"`
}

type VersionMeta struct {
	Version    string          `json:"version"`
	Manifest   json.RawMessage `json:"manifest"` // We'll parse this as needed
	CreatedAt  string          `json:"createdAt"`
	TarballURL string          `json:"tarballUrl"`
	Integrity  string          `json:"integrity"`
}

func (c *Client) GetSkill(name string) (*SkillResponse, error) {
	resp, err := c.HTTPClient.Get(fmt.Sprintf("%s/skills/%s", c.BaseURL, name))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("skill not found: %s", name)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry error: %s", resp.Status)
	}

	var result SkillResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		Username string `json:"username"`
	} `json:"user"`
}

func (c *Client) Login(username, password string) (string, error) {
	reqBody := LoginRequest{
		Username: username,
		Password: password,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("%s/auth/login", c.BaseURL)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("login failed: %s", resp.Status)
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return "", err
	}

	return loginResp.Token, nil
}

func (c *Client) Publish(name, version, tarballPath, token string) error {
	file, err := os.Open(tarballPath)
	if err != nil {
		return err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add metadata fields
	writer.WriteField("name", name)
	writer.WriteField("version", version)

	part, err := writer.CreateFormFile("tarball", filepath.Base(tarballPath))
	if err != nil {
		return err
	}

	if _, err := io.Copy(part, file); err != nil {
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	url := fmt.Sprintf("%s/skills", c.BaseURL)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		// Try to read error message
		var errResp struct {
			Error string `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)

		if errResp.Error != "" {
			return fmt.Errorf("publish failed: %s", errResp.Error)
		}
		return fmt.Errorf("publish failed: %s", resp.Status)
	}

	return nil
}
