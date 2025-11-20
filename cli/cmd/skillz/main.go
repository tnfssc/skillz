package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/Masterminds/semver/v3"
	"github.com/spf13/cobra"
	"github.com/tnfssc/skillz/cli/internal/config"
	"github.com/tnfssc/skillz/cli/internal/installer"
	"github.com/tnfssc/skillz/cli/internal/lockfile"
	"github.com/tnfssc/skillz/cli/internal/parser"
	"github.com/tnfssc/skillz/cli/internal/registry"
	"github.com/tnfssc/skillz/cli/internal/resolver"
)

var (
	version     = "0.1.0"
	registryURL = "http://localhost:8787/api/v1"

	rootCmd = &cobra.Command{
		Use:   "skillz",
		Short: "Package manager for Claude Skills",
		Long: `Skillz is a package manager for Claude Skills and MCP servers.
It provides dependency management, versioning, and a registry for skills.`,
		Version: version,
	}
)

func main() {
	// Add subcommands
	rootCmd.AddCommand(initCmd())
	rootCmd.AddCommand(addCmd())
	rootCmd.AddCommand(installCmd())
	rootCmd.AddCommand(updateCmd())
	rootCmd.AddCommand(removeCmd())
	rootCmd.AddCommand(listCmd())
	rootCmd.AddCommand(searchCmd())
	rootCmd.AddCommand(infoCmd())

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func initCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "init",
		Short: "Initialize a new skillz.toon file",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runInit()
		},
	}
}

func addCmd() *cobra.Command {
	var dev bool
	cmd := &cobra.Command{
		Use:   "add <skill-name or git-url>",
		Short: "Add a skill dependency",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runAdd(args[0], dev)
		},
	}
	cmd.Flags().BoolVarP(&dev, "dev", "D", false, "Add as dev dependency")
	return cmd
}

func installCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "install",
		Short: "Install all dependencies from skillz.toon",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runInstall()
		},
	}
}

func updateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "update [skill-name]",
		Short: "Update dependencies",
		RunE: func(cmd *cobra.Command, args []string) error {
			skillName := ""
			if len(args) > 0 {
				skillName = args[0]
			}
			return runUpdate(skillName)
		},
	}
}

func removeCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "remove <skill-name>",
		Short: "Remove a skill dependency",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runRemove(args[0])
		},
	}
}

func listCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List installed skills",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runList()
		},
	}
}

func searchCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "search <query>",
		Short: "Search the skill registry",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runSearch(args[0])
		},
	}
}

func infoCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "info <skill-name>",
		Short: "Show detailed information about a skill",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runInfo(args[0])
		},
	}
}

// Command implementations

func runInit() error {
	manifestPath := "skillz.toon"

	// Check if skillz.toon already exists
	if _, err := os.Stat(manifestPath); err == nil {
		return fmt.Errorf("skillz.toon already exists")
	}

	fmt.Println("✨ Initializing new skillz project...")

	reader := bufio.NewReader(os.Stdin)

	// Prompt for basic info
	fmt.Print("Skill name: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)
	if name == "" {
		name = filepath.Base(mustGetwd())
	}

	fmt.Print("Version (1.0.0): ")
	ver, _ := reader.ReadString('\n')
	ver = strings.TrimSpace(ver)
	if ver == "" {
		ver = "1.0.0"
	}

	fmt.Print("Description: ")
	desc, _ := reader.ReadString('\n')
	desc = strings.TrimSpace(desc)

	fmt.Print("Author: ")
	author, _ := reader.ReadString('\n')
	author = strings.TrimSpace(author)

	fmt.Print("Main skill file (SKILL.md): ")
	main, _ := reader.ReadString('\n')
	main = strings.TrimSpace(main)
	if main == "" {
		main = "SKILL.md"
	}

	// Create manifest
	manifest := &config.SkillzManifest{
		ManifestVersion: config.ManifestV1,
		Name:            name,
		Version:         ver,
		Description:     &desc,
		Author:          &author,
		License:         stringPtr("MIT"),
		Keywords:        []string{},
		Dependencies:    &config.Dependencies{},
		DevDependencies: &config.Dependencies{},
		Scripts:         config.Scripts{},
		Hooks:           &config.Hooks{},
		Skill: &config.SkillConfig{
			Main:     main,
			Requires: []string{},
			Exports:  []string{},
		},
		Constraints: &config.Constraints{
			OS: []string{"linux", "darwin", "windows"},
		},
	}

	// Write manifest
	if err := parser.WriteManifest(manifestPath, manifest); err != nil {
		return fmt.Errorf("failed to create skillz.toon: %w", err)
	}

	// Create SKILL.md template if it doesn't exist
	if _, err := os.Stat(main); os.IsNotExist(err) {
		template := "# " + name + "\n\n" + desc + "\n\n" +
			"## Purpose\n\n" +
			"Describe what this skill does and when to use it.\n\n" +
			"## Instructions\n\n" +
			"1. Step-by-step instructions for Claude to follow\n" +
			"2. Be specific and clear\n" +
			"3. Include examples if helpful\n\n" +
			"## Examples\n\n" +
			"### Example 1\n\n" +
			"**Input:**\n" +
			"```\n" +
			"Example input\n" +
			"```\n\n" +
			"**Output:**\n" +
			"```\n" +
			"Expected output\n" +
			"```\n\n" +
			"## Notes\n\n" +
			"Any additional information or considerations.\n"

		if err := os.WriteFile(main, []byte(template), 0644); err != nil {
			fmt.Printf("Warning: failed to create %s: %v\n", main, err)
		}
	}

	fmt.Printf("\n✅ Created skillz.toon and %s\n", main)
	fmt.Println("\nNext steps:")
	fmt.Println("  1. Edit SKILL.md with your skill instructions")
	fmt.Println("  2. Add dependencies: skillz add <skill-name>")
	fmt.Println("  3. Install dependencies: skillz install")

	return nil
}

func runAdd(target string, isDev bool) error {
	manifestPath := "skillz.toon"

	// Check if skillz.toon exists
	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return fmt.Errorf("skillz.toon not found. Run 'skillz init' first")
	}

	// Parse existing manifest
	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to parse manifest: %w", err)
	}

	fmt.Printf("📦 Adding %s...\n", target)

	// Determine if it's a git URL or package name
	isGit := strings.HasPrefix(target, "https://") || strings.HasPrefix(target, "git@")

	var skillName string
	var depValue interface{}

	if isGit {
		// Extract skill name from git URL
		parts := strings.Split(target, "/")
		skillName = strings.TrimSuffix(parts[len(parts)-1], ".git")

		depValue = map[string]interface{}{
			"git": target,
		}

		fmt.Printf("Adding git dependency: %s\n", skillName)
	} else {
		// Package from registry
		skillName = target
		// TODO: Fetch latest version from registry
		// For now, just use "latest"
		depValue = "latest"

		fmt.Printf("Adding registry dependency: %s@latest\n", skillName)
	}

	// Initialize dependencies maps if nil
	if manifest.Dependencies == nil {
		manifest.Dependencies = &config.Dependencies{}
	}
	if manifest.Dependencies.Skills == nil {
		manifest.Dependencies.Skills = make(map[string]interface{})
	}
	if manifest.DevDependencies == nil {
		manifest.DevDependencies = &config.Dependencies{}
	}
	if manifest.DevDependencies.Skills == nil {
		manifest.DevDependencies.Skills = make(map[string]interface{})
	}

	// Add to appropriate dependencies
	if isDev {
		manifest.DevDependencies.Skills[skillName] = depValue
	} else {
		manifest.Dependencies.Skills[skillName] = depValue
	}

	// Write updated manifest
	if err := parser.WriteManifest(manifestPath, manifest); err != nil {
		return fmt.Errorf("failed to update manifest: %w", err)
	}

	fmt.Printf("✅ Added %s to %s\n", skillName, manifestPath)
	fmt.Println("\nRun 'skillz install' to install the dependency")

	return nil
}

func runInstall() error {
	manifestPath := "skillz.toon"

	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return fmt.Errorf("skillz.toon not found. Run 'skillz init' first")
	}

	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to parse manifest: %w", err)
	}

	fmt.Println("📥 Installing dependencies...")
	fmt.Printf("Project: %s@%s\n\n", manifest.Name, manifest.Version)

	// Build dependencies list (registry only for now, git deps handled separately)
	var rootDeps []resolver.Dependency
	var gitDeps []resolver.ResolvedPackage // Git deps are "resolved" immediately

	if manifest.Dependencies != nil && manifest.Dependencies.Skills != nil {
		for name, dep := range manifest.Dependencies.Skills {

			// Helper function to get string from map-like structure
			getMapString := func(m interface{}, key string) (string, bool) {
				// Use reflection to access the underlying map
				v := reflect.ValueOf(m)
				if v.Kind() == reflect.Map {
					mapKey := reflect.ValueOf(key)
					val := v.MapIndex(mapKey)
					if val.IsValid() {
						// Try to convert to string
						if strVal, ok := val.Interface().(string); ok {
							return strVal, true
						}
					}
				}
				return "", false
			}

			// Check if it's a git dependency
			if gitURL, hasGit := getMapString(dep, "git"); hasGit {
				// Handle git dependency
				gitRef := ""
				if ref, ok := getMapString(dep, "ref"); ok {
					gitRef = ref
				}

				// For git deps, we need to clone first to get the manifest
				// For simplicity in this MVP, we'll add them to a separate list
				// and install them directly without full transitive resolution
				gitDeps = append(gitDeps, resolver.ResolvedPackage{
					Name:     name,
					Location: "git",
					Source:   gitURL,
					GitURL:   gitURL,
					GitRef:   gitRef,
					Version:  gitRef, // Use ref as version for display
				})
				continue
			}

			// Registry dependency (version string)
			var constraintStr string
			if version, ok := dep.(string); ok {
				constraintStr = version
			} else {
				continue // Skip non-string, non-git deps
			}

			c, err := semver.NewConstraint(constraintStr)
			if err != nil {
				return fmt.Errorf("invalid constraint for %s: %s", name, constraintStr)
			}
			rootDeps = append(rootDeps, resolver.Dependency{
				Name:       name,
				Constraint: c,
			})
		}
	}

	// Resolve registry dependencies
	var plan []resolver.ResolvedPackage

	if len(rootDeps) == 0 && len(gitDeps) == 0 {
		fmt.Println("No dependencies to install.")
		return nil
	}

	if len(rootDeps) > 0 {
		fmt.Printf("Resolving %d registry dependencies...\n", len(rootDeps))

		// Initialize resolver
		client := registry.NewClient("http://localhost:8787/api/v1")
		provider := registry.NewRegistryProvider(client)
		r := resolver.NewResolver(provider)

		// Resolve
		registryPlan, err := r.Resolve(rootDeps)
		if err != nil {
			return fmt.Errorf("resolution failed: %w", err)
		}
		plan = append(plan, registryPlan...)
	}

	// Add git dependencies to plan
	plan = append(plan, gitDeps...)

	// Print plan
	fmt.Println("\nResolution Plan:")
	for _, pkg := range plan {
		if pkg.Location == "git" {
			fmt.Printf("  + %s (git: %s@%s)\n", pkg.Name, pkg.GitURL, pkg.GitRef)
		} else {
			fmt.Printf("  + %s@%s\n", pkg.Name, pkg.Version)
		}
	}

	fmt.Println("\n🚀 Installing packages...")

	// Initialize installer
	inst := installer.NewInstaller(mustGetwd())

	// Create lockfile structure
	lock := &lockfile.Lockfile{
		Version:  1,
		Packages: make(map[string]lockfile.LockPackage),
	}

	for _, pkg := range plan {
		if err := inst.Install(pkg); err != nil {
			return fmt.Errorf("failed to install %s@%s: %w", pkg.Name, pkg.Version, err)
		}

		// Add to lockfile
		lockPkg := lockfile.LockPackage{
			Resolved: pkg.Source,
		}

		switch pkg.Location {
		case "registry":
			lockPkg.Version = pkg.Version
			lockPkg.Integrity = pkg.Integrity
		case "git":
			lockPkg.GitURL = pkg.GitURL
			lockPkg.GitRef = pkg.GitRef
			lockPkg.GitSHA = pkg.GitSHA
		}

		lock.Packages[pkg.Name] = lockPkg
	}

	// Write lockfile
	if err := lockfile.WriteLockfile("skillz.lock", lock); err != nil {
		return fmt.Errorf("failed to write lockfile: %w", err)
	}

	fmt.Println("\n✅ Installation complete!")

	return nil
}

func runUpdate(skillName string) error {
	if skillName == "" {
		fmt.Println("🔄 Updating all dependencies...")
	} else {
		fmt.Printf("🔄 Updating %s...\n", skillName)
	}
	return fmt.Errorf("not implemented yet")
}

func runRemove(skillName string) error {
	manifestPath := "skillz.toon"

	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return fmt.Errorf("skillz.toon not found")
	}

	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to parse manifest: %w", err)
	}

	fmt.Printf("🗑️  Removing %s...\n", skillName)

	// Check if skill exists in dependencies
	found := false
	if manifest.Dependencies != nil && manifest.Dependencies.Skills != nil {
		if _, exists := manifest.Dependencies.Skills[skillName]; exists {
			delete(manifest.Dependencies.Skills, skillName)
			found = true
		}
	}
	if manifest.DevDependencies != nil && manifest.DevDependencies.Skills != nil {
		if _, exists := manifest.DevDependencies.Skills[skillName]; exists {
			delete(manifest.DevDependencies.Skills, skillName)
			found = true
		}
	}

	if !found {
		return fmt.Errorf("skill '%s' not found in dependencies", skillName)
	}

	// Write updated manifest
	if err := parser.WriteManifest(manifestPath, manifest); err != nil {
		return fmt.Errorf("failed to update manifest: %w", err)
	}

	fmt.Printf("✅ Removed %s from dependencies\n", skillName)

	return nil
}

func runList() error {
	manifestPath := "skillz.toon"

	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return fmt.Errorf("skillz.toon not found")
	}

	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to parse manifest: %w", err)
	}

	fmt.Printf("📋 %s@%s\n\n", manifest.Name, manifest.Version)

	if manifest.Dependencies != nil && len(manifest.Dependencies.Skills) > 0 {
		fmt.Println("Dependencies:")
		for name, dep := range manifest.Dependencies.Skills {
			if version, ok := dep.(string); ok {
				fmt.Printf("  • %s@%s\n", name, version)
			} else {
				fmt.Printf("  • %s (git)\n", name)
			}
		}
		fmt.Println()
	}

	if manifest.DevDependencies != nil && len(manifest.DevDependencies.Skills) > 0 {
		fmt.Println("Dev Dependencies:")
		for name, dep := range manifest.DevDependencies.Skills {
			if version, ok := dep.(string); ok {
				fmt.Printf("  • %s@%s\n", name, version)
			} else {
				fmt.Printf("  • %s (git)\n", name)
			}
		}
		fmt.Println()
	}

	if manifest.Dependencies != nil && len(manifest.Dependencies.MCPServers) > 0 {
		fmt.Println("MCP Servers:")
		for name := range manifest.Dependencies.MCPServers {
			fmt.Printf("  • %s\n", name)
		}
		fmt.Println()
	}

	if manifest.Dependencies != nil && len(manifest.Dependencies.CLITools) > 0 {
		fmt.Println("CLI Tools:")
		for name, version := range manifest.Dependencies.CLITools {
			fmt.Printf("  • %s@%s\n", name, version)
		}
	}

	return nil
}

func runSearch(query string) error {
	fmt.Printf("🔍 Searching for '%s'...\n", query)
	return fmt.Errorf("not implemented yet - requires registry API")
}

func runInfo(skillName string) error {
	fmt.Printf("ℹ️  Information about %s:\n", skillName)
	return fmt.Errorf("not implemented yet - requires registry API")
}

func mustGetwd() string {
	dir, err := os.Getwd()
	if err != nil {
		return "my-skill"
	}
	return dir
}

func stringPtr(s string) *string {
	return &s
}
