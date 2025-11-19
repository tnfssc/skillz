package config

import "time"

// ManifestVersion indicates the skillz.yaml format version
type ManifestVersion string

const (
	ManifestV1 ManifestVersion = "1"
)

// SkillzManifest represents the complete skillz.yaml file
type SkillzManifest struct {
	ManifestVersion ManifestVersion `yaml:"manifest-version"`
	Name            string          `yaml:"name"`
	Version         string          `yaml:"version"`
	Description     string          `yaml:"description,omitempty"`
	Author          string          `yaml:"author,omitempty"`
	License         string          `yaml:"license,omitempty"`
	Homepage        string          `yaml:"homepage,omitempty"`
	Repository      string          `yaml:"repository,omitempty"`
	Keywords        []string        `yaml:"keywords,omitempty"`
	Dependencies    Dependencies    `yaml:"dependencies,omitempty"`
	DevDependencies Dependencies    `yaml:"dev-dependencies,omitempty"`
	Scripts         Scripts         `yaml:"scripts,omitempty"`
	Hooks           Hooks           `yaml:"hooks,omitempty"`
	Skill           SkillConfig     `yaml:"skill,omitempty"`
	Constraints     Constraints     `yaml:"constraints,omitempty"`
	Integrity       Integrity       `yaml:"integrity,omitempty"`
}

// Dependencies represents all types of dependencies
type Dependencies struct {
	Skills     map[string]interface{} `yaml:"skills,omitempty"`
	MCPServers map[string]interface{} `yaml:"mcp-servers,omitempty"`
	CLITools   map[string]string      `yaml:"cli-tools,omitempty"`
}

// SkillDependency represents a skill dependency (can be version string or object)
type SkillDependency struct {
	Version string `yaml:"version,omitempty"`
	Git     string `yaml:"git,omitempty"`
	Branch  string `yaml:"branch,omitempty"`
	Tag     string `yaml:"tag,omitempty"`
	Path    string `yaml:"path,omitempty"`
}

// MCPServerDependency represents an MCP server dependency
type MCPServerDependency struct {
	Version string                 `yaml:"version,omitempty"`
	Config  map[string]interface{} `yaml:"config,omitempty"`
}

// Scripts defines executable commands
type Scripts map[string]string

// Hooks defines lifecycle hooks
type Hooks struct {
	PreInstall  string `yaml:"pre-install,omitempty"`
	PostInstall string `yaml:"post-install,omitempty"`
	PreUpdate   string `yaml:"pre-update,omitempty"`
	PostUpdate  string `yaml:"post-update,omitempty"`
}

// SkillConfig defines skill-specific configuration
type SkillConfig struct {
	Main     string   `yaml:"main"`
	Requires []string `yaml:"requires,omitempty"`
	Exports  []string `yaml:"exports,omitempty"`
}

// Constraints defines platform and version requirements
type Constraints struct {
	OS            []string `yaml:"os,omitempty"`
	ClaudeVersion string   `yaml:"claude-version,omitempty"`
}

// Integrity holds security verification data
type Integrity struct {
	Checksum  string `yaml:"checksum,omitempty"`
	Signature string `yaml:"signature,omitempty"`
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
