package config

import (
	"testing"
)

func TestValidateManifest(t *testing.T) {
	tests := []struct {
		name      string
		manifest  *SkillzManifest
		wantError bool
	}{
		{
			name: "valid manifest",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Name:            "test-skill",
				Version:         "1.0.0",
				Skill: &SkillConfig{
					Main: "SKILL.md",
				},
			},
			wantError: false,
		},
		{
			name: "missing name",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Version:         "1.0.0",
				Skill: &SkillConfig{
					Main: "SKILL.md",
				},
			},
			wantError: true,
		},
		{
			name: "missing version",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Name:            "test-skill",
				Skill: &SkillConfig{
					Main: "SKILL.md",
				},
			},
			wantError: true,
		},
		{
			name: "invalid version format",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Name:            "test-skill",
				Version:         "invalid",
				Skill: &SkillConfig{
					Main: "SKILL.md",
				},
			},
			wantError: true,
		},
		{
			name: "missing skill config",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Name:            "test-skill",
				Version:         "1.0.0",
			},
			wantError: true,
		},
		{
			name: "missing skill.main",
			manifest: &SkillzManifest{
				ManifestVersion: ManifestV1,
				Name:            "test-skill",
				Version:         "1.0.0",
				Skill:           &SkillConfig{},
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateManifest(tt.manifest)
			if (err != nil) != tt.wantError {
				t.Errorf("ValidateManifest() error = %v, wantError %v", err, tt.wantError)
			}
		})
	}
}

func TestSkillConfigValidation(t *testing.T) {
	tests := []struct {
		name      string
		config    *SkillConfig
		wantError bool
	}{
		{
			name: "valid config",
			config: &SkillConfig{
				Main:     "SKILL.md",
				Requires: []string{"tool1", "tool2"},
				Exports:  []string{"function1"},
			},
			wantError: false,
		},
		{
			name: "empty requires",
			config: &SkillConfig{
				Main:     "SKILL.md",
				Requires: []string{},
				Exports:  []string{"function1"},
			},
			wantError: false,
		},
		{
			name: "empty exports",
			config: &SkillConfig{
				Main:     "SKILL.md",
				Requires: []string{"tool1"},
				Exports:  []string{},
			},
			wantError: false,
		},
		{
			name:      "missing main",
			config:    &SkillConfig{},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSkillConfig(tt.config)
			if (err != nil) != tt.wantError {
				t.Errorf("validateSkillConfig() error = %v, wantError %v", err, tt.wantError)
			}
		})
	}
}

func validateSkillConfig(config *SkillConfig) error {
	if config.Main == "" {
		return &ValidationError{Field: "skill.main", Message: "is required"}
	}
	return nil
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + " " + e.Message
}

// ValidateManifest validates a skillz manifest
func ValidateManifest(manifest *SkillzManifest) error {
	if manifest.Name == "" {
		return &ValidationError{Field: "name", Message: "is required"}
	}
	if manifest.Version == "" {
		return &ValidationError{Field: "version", Message: "is required"}
	}

	// Basic version format check (simplified)
	if len(manifest.Version) < 5 || manifest.Version[0] < '0' || manifest.Version[0] > '9' {
		return &ValidationError{Field: "version", Message: "must be valid semver"}
	}

	if manifest.Skill == nil {
		return &ValidationError{Field: "skill", Message: "is required"}
	}

	return validateSkillConfig(manifest.Skill)
}
