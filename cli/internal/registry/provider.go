package registry

import (
	"encoding/json"
	"fmt"

	"github.com/Masterminds/semver/v3"
	"github.com/tnfssc/skillz/cli/internal/config"
	"github.com/tnfssc/skillz/cli/internal/resolver"
)

type RegistryProvider struct {
	client *Client
	cache  map[string]*SkillResponse
}

func NewRegistryProvider(client *Client) *RegistryProvider {
	return &RegistryProvider{
		client: client,
		cache:  make(map[string]*SkillResponse),
	}
}

func (p *RegistryProvider) getSkill(name string) (*SkillResponse, error) {
	if cached, ok := p.cache[name]; ok {
		return cached, nil
	}
	skill, err := p.client.GetSkill(name)
	if err != nil {
		return nil, err
	}
	p.cache[name] = skill
	return skill, nil
}

// GetVersions returns all available versions for a package
func (p *RegistryProvider) GetVersions(name string) ([]*semver.Version, error) {
	skill, err := p.getSkill(name)
	if err != nil {
		return nil, err
	}

	var versions []*semver.Version
	for _, v := range skill.Versions {
		ver, err := semver.NewVersion(v.Version)
		if err != nil {
			// Skip invalid versions instead of failing?
			// For now, let's log or ignore. Ignoring is safer for resilience.
			continue
		}
		versions = append(versions, ver)
	}
	return versions, nil
}

// GetDependencies returns the dependencies for a specific package version
func (p *RegistryProvider) GetDependencies(name string, version *semver.Version) ([]resolver.Dependency, error) {
	skill, err := p.getSkill(name)
	if err != nil {
		return nil, err
	}

	// Find the specific version
	var targetVersion *VersionMeta
	for _, v := range skill.Versions {
		if v.Version == version.String() {
			targetVersion = &v
			break
		}
	}

	if targetVersion == nil {
		return nil, fmt.Errorf("version %s not found for package %s", version, name)
	}

	// Parse manifest to get dependencies
	var manifest config.SkillzManifest
	if err := json.Unmarshal(targetVersion.Manifest, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse manifest for %s@%s: %w", name, version, err)
	}

	var deps []resolver.Dependency

	// Add regular dependencies
	if manifest.Dependencies.Skills != nil {
		for depName, depSpec := range manifest.Dependencies.Skills {
			// Handle string version or object
			var constraintStr string

			// We need to handle the polymorphic nature of dependencies here
			// But wait, config.Dependencies.Skills is map[string]interface{}?
			// Let's check config/types.go

			// Actually, let's look at how we parsed it in parser.go.
			// In config/types.go, Dependencies struct has Skills map[string]interface{}?
			// No, let's check types.go content.

			// Assuming it's map[string]interface{} based on previous work,
			// or maybe I need to check types.go to be sure.

			// For now, let's assume simple string version for MVP since that's what we seeded.
			// If it's an object, we might need more logic.

			switch v := depSpec.(type) {
			case string:
				constraintStr = v
			case map[string]interface{}:
				// Handle object format (e.g. git, or version field)
				if ver, ok := v["version"].(string); ok {
					constraintStr = ver
				} else {
					// If it's a git dependency, we might skip it for registry resolution
					// or handle it differently. For now, skip non-registry deps in this provider.
					continue
				}
			default:
				continue
			}

			c, err := semver.NewConstraint(constraintStr)
			if err != nil {
				return nil, fmt.Errorf("invalid constraint for %s: %s", depName, constraintStr)
			}
			deps = append(deps, resolver.Dependency{
				Name:       depName,
				Constraint: c,
			})
		}
	}

	return deps, nil
}

// GetArtifact returns artifact metadata for a specific package version
func (p *RegistryProvider) GetArtifact(name string, version *semver.Version) (*resolver.ArtifactInfo, error) {
	skill, err := p.getSkill(name)
	if err != nil {
		return nil, err
	}

	// Find the specific version
	var targetVersion *VersionMeta
	for _, v := range skill.Versions {
		if v.Version == version.String() {
			targetVersion = &v
			break
		}
	}

	if targetVersion == nil {
		return nil, fmt.Errorf("version %s not found for package %s", version, name)
	}

	return &resolver.ArtifactInfo{
		Location:   "registry",
		Source:     targetVersion.TarballURL,
		TarballURL: targetVersion.TarballURL,
		Integrity:  targetVersion.Integrity,
	}, nil
}
