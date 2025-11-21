package config

import "time"

// ManifestVersion indicates the skillz.yaml format version
type ManifestVersion string

const (
	ManifestV1 ManifestVersion = "1"
)

// SkillzManifest represents the complete skillz.yaml file
type SkillzManifest struct {
	ManifestVersion ManifestVersion `toon:"manifest-version"`
	Name            string          `toon:"name"`
	Version         string          `toon:"version"`
	Description     *string         `toon:"description,omitempty"`
	Author          interface{}     `toon:"author,omitempty"`
	License         *string         `toon:"license,omitempty"`
	Homepage        *string         `toon:"homepage,omitempty"`
	Repository      *string         `toon:"repository,omitempty"`
	Keywords        []string        `toon:"keywords,omitempty"`
	Dependencies    *Dependencies   `toon:"dependencies,omitempty"`
	DevDependencies *Dependencies   `toon:"dev-dependencies,omitempty"`
	Scripts         Scripts         `toon:"scripts,omitempty"`
	Hooks           *Hooks          `toon:"hooks,omitempty"`
	Skill           *SkillConfig    `toon:"skill,omitempty"`
	Constraints     *Constraints    `toon:"constraints,omitempty"`
	Integrity       *Integrity      `toon:"integrity,omitempty"`
}

// Dependencies represents all types of dependencies
type Dependencies struct {
	Skills     map[string]interface{} `toon:"skills,omitempty"`
	MCPServers map[string]interface{} `toon:"mcp-servers,omitempty"`
	CLITools   map[string]string      `toon:"cli-tools,omitempty"`
}

// SkillDependency represents a skill dependency (can be version string or object)
type SkillDependency struct {
	Version string `toon:"version,omitempty"`
	Git     string `toon:"git,omitempty"`
	Branch  string `toon:"branch,omitempty"`
	Tag     string `toon:"tag,omitempty"`
	Path    string `toon:"path,omitempty"`
}

// MCPServerDependency represents an MCP server dependency
type MCPServerDependency struct {
	Version string                 `toon:"version,omitempty"`
	Config  map[string]interface{} `toon:"config,omitempty"`
}

// Scripts defines executable commands
type Scripts map[string]string

// Hooks defines lifecycle hooks
type Hooks struct {
	PreInstall  *string `toon:"pre-install,omitempty"`
	PostInstall *string `toon:"post-install,omitempty"`
	PreUpdate   *string `toon:"pre-update,omitempty"`
	PostUpdate  *string `toon:"post-update,omitempty"`
}

// SkillConfig defines skill-specific configuration
type SkillConfig struct {
	Main     string   `toon:"main"`
	Requires []string `toon:"requires,omitempty"`
	Exports  []string `toon:"exports,omitempty"`
}

// Constraints defines platform and version requirements
type Constraints struct {
	OS            []string `toon:"os,omitempty"`
	ClaudeVersion *string  `toon:"claude-version,omitempty"`
}

// Integrity holds security verification data
type Integrity struct {
	Checksum  *string `toon:"checksum,omitempty"`
	Signature *string `toon:"signature,omitempty"`
}

// LockFile represents skillz.lock content
type LockFile struct {
	Version         string                 `json:"version"`
	LockfileVersion int                    `json:"lockfileVersion"`
	Generated       time.Time              `json:"generated"`
	Skills          map[string]LockedSkill `json:"skills"`
	MCPServers      map[string]LockedSkill `json:"mcp-servers,omitempty"`
	CLITools        map[string]LockedTool  `json:"cli-tools,omitempty"`
}

// LockedSkill represents a locked skill dependency
type LockedSkill struct {
	Version      string            `json:"version"`
	Resolved     string            `json:"resolved"`
	Integrity    string            `json:"integrity"`
	Dependencies map[string]string `json:"dependencies,omitempty"`
}

// LockedTool represents a locked CLI tool
type LockedTool struct {
	Version  string `json:"version"`
	Resolved string `json:"resolved"`
}
