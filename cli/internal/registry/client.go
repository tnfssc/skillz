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
	defer func() { _ = resp.Body.Close() }()

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

// Login method removed in favor of token-based auth via CLI flags

func (c *Client) Publish(name, version, tarballPath, token string) error {
	file, err := os.Open(tarballPath)
	if err != nil {
		return err
	}
	defer func() { _ = file.Close() }()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add metadata fields
	if err := writer.WriteField("name", name); err != nil {
		return err
	}
	if err := writer.WriteField("version", version); err != nil {
		return err
	}

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
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		// Try to read error message
		var errResp struct {
			Error string `json:"error"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			return fmt.Errorf("publish failed: %s (and failed to parse error response: %v)", resp.Status, err)
		}

		if errResp.Error != "" {
			return fmt.Errorf("publish failed: %s", errResp.Error)
		}
		return fmt.Errorf("publish failed: %s", resp.Status)
	}

	return nil
}
