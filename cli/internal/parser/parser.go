package parser

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/mitchellh/mapstructure"
	"github.com/tnfssc/goon/pkg/toon"
	"github.com/tnfssc/skillz/cli/internal/config"
)

// ParseManifest reads and parses a skillz.toon file
func ParseManifest(path string) (*config.SkillzManifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	// Decode TOON to map[string]interface{}
	raw, err := toon.Decode(string(data), toon.DecodeOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
	}

	var m config.SkillzManifest

	// Decode map to struct using mapstructure
	// We need to use "toon" tag because we updated types.go
	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		TagName:          "toon",
		WeaklyTypedInput: true,
		Result:           &m,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create decoder: %w", err)
	}

	if err := decoder.Decode(raw); err != nil {
		return nil, fmt.Errorf("failed to decode manifest to struct: %w", err)
	}

	// Validate manifest version
	if m.ManifestVersion != config.ManifestV1 {
		return nil, fmt.Errorf("unsupported manifest version: %s", m.ManifestVersion)
	}

	// Validate required fields
	if m.Name == "" {
		return nil, fmt.Errorf("manifest must have a name")
	}
	if m.Version == "" {
		return nil, fmt.Errorf("manifest must have a version")
	}
	if m.Skill.Main == "" {
		return nil, fmt.Errorf("manifest must specify skill.main")
	}

	return &m, nil
}

// WriteManifest writes a skillz.toon file
func WriteManifest(path string, manifest *config.SkillzManifest) error {
	// Convert struct to map[string]interface{} for TOON encoding
	// We use json.Marshal/Unmarshal to handle nested structs properly
	jsonData, err := json.Marshal(manifest)
	if err != nil {
		return fmt.Errorf("failed to marshal manifest to JSON: %w", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(jsonData, &m); err != nil {
		return fmt.Errorf("failed to unmarshal JSON to map: %w", err)
	}

	// Encode map to TOON string
	data, err := toon.Encode(m, toon.EncodeOptions{IndentSize: 2})
	if err != nil {
		return fmt.Errorf("failed to marshal manifest: %w", err)
	}

	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		return fmt.Errorf("failed to write manifest: %w", err)
	}

	return nil
}

// NormalizeDependency converts interface{} to SkillDependency
func NormalizeDependency(dep interface{}) (*config.SkillDependency, error) {
	switch v := dep.(type) {
	case string:
		// Simple version string
		return &config.SkillDependency{Version: v}, nil
	case map[string]interface{}:
		// Complex dependency object
		result := &config.SkillDependency{}

		if version, ok := v["version"].(string); ok {
			result.Version = version
		}
		if git, ok := v["git"].(string); ok {
			result.Git = git
		}
		if branch, ok := v["branch"].(string); ok {
			result.Branch = branch
		}
		if tag, ok := v["tag"].(string); ok {
			result.Tag = tag
		}
		if path, ok := v["path"].(string); ok {
			result.Path = path
		}

		return result, nil
	default:
		return nil, fmt.Errorf("invalid dependency format")
	}
}
