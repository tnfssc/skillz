package parser

import (
	"fmt"
	"os"

	"github.com/skillz/cli/internal/config"
	"gopkg.in/yaml.v3"
)

// ParseManifest reads and parses a skillz.yaml file
func ParseManifest(path string) (*config.SkillzManifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest config.SkillzManifest
	if err := yaml.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
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
	if manifest.Skill.Main == "" {
		return nil, fmt.Errorf("manifest must specify skill.main")
	}

	return &manifest, nil
}

// WriteManifest writes a skillz.yaml file
func WriteManifest(path string, manifest *config.SkillzManifest) error {
	data, err := yaml.Marshal(manifest)
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
