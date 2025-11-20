package parser

import (
	"fmt"
	"os"

	"github.com/tnfssc/goon/pkg/toon"
	"github.com/tnfssc/skillz/cli/internal/config"
)

// ParseManifest parses a skillz.toon file
func ParseManifest(path string) (*config.SkillzManifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest config.SkillzManifest
	if err := toon.Unmarshal(data, &manifest, toon.DecodeOptions{IndentSize: 2}); err != nil {
		return nil, fmt.Errorf("failed to parse TOON manifest: %w", err)
	}

	// Validate manifest version
	if manifest.ManifestVersion != config.ManifestV1 {
		return nil, fmt.Errorf("unsupported manifest version: %s", manifest.ManifestVersion)
	}

	// Validate required fields
	if manifest.Name == "" {
		return nil, fmt.Errorf("manifest must have a name")
	}
	if manifest.Version == "" {
		return nil, fmt.Errorf("manifest must have a version")
	}
	if manifest.Skill == nil || manifest.Skill.Main == "" {
		return nil, fmt.Errorf("manifest must specify skill.main")
	}

	return &manifest, nil
}

// WriteManifest writes a manifest to a skillz.toon file
func WriteManifest(path string, manifest *config.SkillzManifest) error {
	data, err := toon.Marshal(manifest, toon.EncodeOptions{IndentSize: 2})
	if err != nil {
		return fmt.Errorf("failed to marshal manifest: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
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
