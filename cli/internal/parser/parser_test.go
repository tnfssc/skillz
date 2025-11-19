package parser

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/skillz/cli/internal/config"
)

func TestParseManifest(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir := t.TempDir()
	manifestPath := filepath.Join(tmpDir, "skillz.yaml")

	// Test valid manifest
	validYAML := `manifest-version: "1"
name: test-skill
version: 1.0.0
description: A test skill
author: Test Author
license: MIT
skill:
  main: SKILL.md
  requires:
    - tools
  exports:
    - analyze
dependencies:
  skills:
    helper-skill: "^1.0.0"
  mcp-servers:
    filesystem: "^1.0.0"
  cli-tools:
    node: "20.0.0"
`

	if err := os.WriteFile(manifestPath, []byte(validYAML), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	manifest, err := ParseManifest(manifestPath)
	if err != nil {
		t.Fatalf("failed to parse valid manifest: %v", err)
	}

	// Verify parsed values
	if manifest.Name != "test-skill" {
		t.Errorf("expected name 'test-skill', got '%s'", manifest.Name)
	}
	if manifest.Version != "1.0.0" {
		t.Errorf("expected version '1.0.0', got '%s'", manifest.Version)
	}
	if manifest.Skill.Main != "SKILL.md" {
		t.Errorf("expected main 'SKILL.md', got '%s'", manifest.Skill.Main)
	}
	if len(manifest.Dependencies.Skills) != 1 {
		t.Errorf("expected 1 skill dependency, got %d", len(manifest.Dependencies.Skills))
	}
	if len(manifest.Dependencies.CLITools) != 1 {
		t.Errorf("expected 1 CLI tool, got %d", len(manifest.Dependencies.CLITools))
	}
}

func TestParseManifest_InvalidVersion(t *testing.T) {
	tmpDir := t.TempDir()
	manifestPath := filepath.Join(tmpDir, "skillz.yaml")

	invalidYAML := `manifest-version: "2"
name: test-skill
version: 1.0.0
skill:
  main: SKILL.md
`

	if err := os.WriteFile(manifestPath, []byte(invalidYAML), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	_, err := ParseManifest(manifestPath)
	if err == nil {
		t.Error("expected error for unsupported manifest version")
	}
}

func TestParseManifest_MissingRequired(t *testing.T) {
	tmpDir := t.TempDir()
	manifestPath := filepath.Join(tmpDir, "skillz.yaml")

	tests := []struct {
		name string
		yaml string
	}{
		{
			name: "missing name",
			yaml: `manifest-version: "1"
version: 1.0.0
skill:
  main: SKILL.md
`,
		},
		{
			name: "missing version",
			yaml: `manifest-version: "1"
name: test-skill
skill:
  main: SKILL.md
`,
		},
		{
			name: "missing skill.main",
			yaml: `manifest-version: "1"
name: test-skill
version: 1.0.0
skill:
  requires: []
`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := os.WriteFile(manifestPath, []byte(tt.yaml), 0644); err != nil {
				t.Fatalf("failed to write test file: %v", err)
			}

			_, err := ParseManifest(manifestPath)
			if err == nil {
				t.Errorf("expected error for %s", tt.name)
			}
		})
	}
}

func TestWriteManifest(t *testing.T) {
	tmpDir := t.TempDir()
	manifestPath := filepath.Join(tmpDir, "skillz.yaml")

	manifest := &config.SkillzManifest{
		ManifestVersion: config.ManifestV1,
		Name:            "test-skill",
		Version:         "1.0.0",
		Description:     "A test skill",
		Author:          "Test Author",
		License:         "MIT",
		Skill: config.SkillConfig{
			Main:     "SKILL.md",
			Requires: []string{"tools"},
			Exports:  []string{"analyze"},
		},
	}

	if err := WriteManifest(manifestPath, manifest); err != nil {
		t.Fatalf("failed to write manifest: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		t.Error("manifest file was not created")
	}

	// Parse it back
	parsed, err := ParseManifest(manifestPath)
	if err != nil {
		t.Fatalf("failed to parse written manifest: %v", err)
	}

	if parsed.Name != manifest.Name {
		t.Errorf("name mismatch: expected '%s', got '%s'", manifest.Name, parsed.Name)
	}
}

func TestNormalizeDependency(t *testing.T) {
	tests := []struct {
		name      string
		input     interface{}
		wantError bool
		checkFunc func(*testing.T, *config.SkillDependency)
	}{
		{
			name:      "simple version string",
			input:     "^1.0.0",
			wantError: false,
			checkFunc: func(t *testing.T, dep *config.SkillDependency) {
				if dep.Version != "^1.0.0" {
					t.Errorf("expected version '^1.0.0', got '%s'", dep.Version)
				}
			},
		},
		{
			name: "git dependency",
			input: map[string]interface{}{
				"git":    "https://github.com/user/skill",
				"branch": "main",
			},
			wantError: false,
			checkFunc: func(t *testing.T, dep *config.SkillDependency) {
				if dep.Git != "https://github.com/user/skill" {
					t.Errorf("expected git URL, got '%s'", dep.Git)
				}
				if dep.Branch != "main" {
					t.Errorf("expected branch 'main', got '%s'", dep.Branch)
				}
			},
		},
		{
			name:      "invalid type",
			input:     123,
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dep, err := NormalizeDependency(tt.input)
			
			if tt.wantError {
				if err == nil {
					t.Error("expected error but got none")
				}
				return
			}
			
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			
			if tt.checkFunc != nil {
				tt.checkFunc(t, dep)
			}
		})
	}
}
