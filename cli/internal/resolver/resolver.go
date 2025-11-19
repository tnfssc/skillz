package resolver

import (
	"fmt"
	"sort"

	"github.com/Masterminds/semver/v3"
)

// Resolver handles dependency resolution
type Resolver struct {
	provider Provider
}

// NewResolver creates a new resolver with the given provider
func NewResolver(provider Provider) *Resolver {
	return &Resolver{
		provider: provider,
	}
}

// Resolve takes a list of root dependencies and returns a flat list of resolved packages
// This is a simplified implementation that picks the latest version satisfying constraints
// It does not yet perform full SAT solving or backtracking for complex conflicts
func (r *Resolver) Resolve(rootDeps []Dependency) ([]ResolvedPackage, error) {
	// Map to store selected versions: package name -> selected version
	selected := make(map[string]*semver.Version)
	
	// Queue of dependencies to process
	queue := make([]Dependency, len(rootDeps))
	copy(queue, rootDeps)

	// Process queue
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		// Check if we already selected a version for this package
		if existingVer, ok := selected[current.Name]; ok {
			// Verify the existing selection satisfies the new constraint
			if !current.Constraint.Check(existingVer) {
				return nil, fmt.Errorf("conflict: package %s version %s does not satisfy constraint %s", 
					current.Name, existingVer, current.Constraint)
			}
			continue
		}

		// Fetch available versions
		versions, err := r.provider.GetVersions(current.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to get versions for %s: %w", current.Name, err)
		}

		// Find the best matching version (latest that satisfies constraint)
		bestVer := r.findBestVersion(versions, current.Constraint)
		if bestVer == nil {
			return nil, fmt.Errorf("no version found for %s satisfying %s", current.Name, current.Constraint)
		}

		// Select this version
		selected[current.Name] = bestVer

		// Get dependencies for this version
		deps, err := r.provider.GetDependencies(current.Name, bestVer)
		if err != nil {
			return nil, fmt.Errorf("failed to get dependencies for %s@%s: %w", current.Name, bestVer, err)
		}

		// Add dependencies to queue
		queue = append(queue, deps...)
	}

	// Convert to result list
	result := make([]ResolvedPackage, 0, len(selected))
	for name, ver := range selected {
		// Get artifact info
		artifact, err := r.provider.GetArtifact(name, ver)
		if err != nil {
			// Fallback if artifact info fails (shouldn't happen if version exists)
			// But strictly we should probably error out.
			// For now, let's just use defaults to avoid breaking if provider doesn't support it fully yet
			// or return error
			return nil, fmt.Errorf("failed to get artifact info for %s@%s: %w", name, ver, err)
		}

		result = append(result, ResolvedPackage{
			Name:       name,
			Version:    ver.String(),
			Location:   artifact.Location,
			Source:     artifact.Source,
			TarballURL: artifact.TarballURL,
			Integrity:  artifact.Integrity,
		})
	}

	// Sort for deterministic output
	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})

	return result, nil
}

// findBestVersion finds the highest version that satisfies the constraint
func (r *Resolver) findBestVersion(versions []*semver.Version, constraint *semver.Constraints) *semver.Version {
	// Sort versions descending
	sort.Slice(versions, func(i, j int) bool {
		return versions[i].GreaterThan(versions[j])
	})

	for _, v := range versions {
		if constraint.Check(v) {
			return v
		}
	}
	return nil
}
