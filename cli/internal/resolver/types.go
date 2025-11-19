package resolver

import (
	"github.com/Masterminds/semver/v3"
)

// Package represents a unique package in the registry
type Package struct {
	Name string
}

// Version represents a specific version of a package
type Version struct {
	Package Package
	Version *semver.Version
}

// Dependency represents a requirement for a package
type Dependency struct {
	Name       string
	Constraint *semver.Constraints
}

// ResolvedPackage represents a package with its resolved version and location
type ResolvedPackage struct {
	Name       string
	Version    string
	Location   string // "registry" or "git"
	Source     string // URL or tarball URL
	TarballURL string
	Integrity  string
	GitURL     string // For git dependencies
	GitRef     string // For git dependencies (tag/branch)
	GitSHA     string // For git dependencies (commit SHA)
}

// ArtifactInfo contains metadata about the package artifact
type ArtifactInfo struct {
	Location   string
	Source     string
	TarballURL string
	Integrity  string
}

// Provider is an interface for fetching package information
type Provider interface {
	// GetVersions returns all available versions for a package
	GetVersions(name string) ([]*semver.Version, error)
	// GetDependencies returns the dependencies for a specific package version
	GetDependencies(name string, version *semver.Version) ([]Dependency, error)
	// GetArtifact returns artifact metadata for a specific package version
	GetArtifact(name string, version *semver.Version) (*ArtifactInfo, error)
}
