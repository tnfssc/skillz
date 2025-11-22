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
	"github.com/tnfssc/skillz/cli/internal/ui"
)

var (
	version     = "0.1.0"
	registryURL = ""

	rootCmd = &cobra.Command{
		Use:   "skillz",
		Short: "Package manager for Skillz",
		Long: `Skillz is a package manager for intelligence packages and MCP servers.
It provides dependency management, versioning, and a registry for skills.`,
		Version: version,
	}
)

func init() {
	// Customize help template
	rootCmd.SetHelpTemplate(`{{with (or .Long .Short)}}{{. | trimTrailingWhitespaces}}

{{end}}{{if or .Runnable .HasSubCommands}}{{.UsageString}}{{end}}`)

	// Customize usage template with styled output
	rootCmd.SetUsageTemplate(`
✨ Usage:{{if .Runnable}}
  {{.UseLine}}{{end}}{{if .HasAvailableSubCommands}}
  {{.CommandPath}} [command]{{end}}{{if gt (len .Aliases) 0}}

Aliases:
  {{.NameAndAliases}}{{end}}{{if .HasExample}}

Examples:
{{.Example}}{{end}}{{if .HasAvailableSubCommands}}{{$cmds := .Commands}}{{if eq (len .Groups) 0}}

📋 Available Commands:{{range $cmds}}{{if (or .IsAvailableCommand (eq .Name "help"))}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{else}}{{range $group := .Groups}}

{{.Title}}{{range $cmds}}{{if (and (eq .GroupID $group.ID) (or .IsAvailableCommand (eq .Name "help")))}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{end}}{{if not .AllChildCommandsHaveGroup}}

Additional Commands:{{range $cmds}}{{if (and (eq .GroupID "") (or .IsAvailableCommand (eq .Name "help")))}}
  {{rpad .Name .NamePadding }} {{.Short}}{{end}}{{end}}{{end}}{{end}}{{end}}{{if .HasAvailableLocalFlags}}

⚙️  Flags:
{{.LocalFlags.FlagUsages | trimTrailingWhitespaces}}{{end}}{{if .HasAvailableInheritedFlags}}

Global Flags:
{{.InheritedFlags.FlagUsages | trimTrailingWhitespaces}}{{end}}{{if .HasHelpSubCommands}}

Additional help topics:{{range .Commands}}{{if .IsAdditionalHelpTopicCommand}}
  {{rpad .CommandPath .CommandPathPadding}} {{.Short}}{{end}}{{end}}{{end}}{{if .HasAvailableSubCommands}}

Use "{{.CommandPath}} [command] --help" for more information about a command.{{end}}
`)

	// Customize version template
	rootCmd.SetVersionTemplate(`{{with .Name}}{{printf "%s " .}}{{end}}{{printf "version %s\n" .Version}}`)
}

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

	fmt.Println(ui.Header("Initialize Skillz Project"))

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
		// Don't initialize Hooks - let it be nil so it's omitted
		Skill: &config.SkillConfig{
			Main:     main,
			Requires: []string{},
			Exports:  []string{},
		},
		// Set constraints only if we have non-empty values
		Constraints: &config.Constraints{
			OS: []string{"linux", "darwin", "windows"},
			// SkillzVersion is nil, will be omitted
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
			"1. Step-by-step instructions to follow\n" +
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

	fmt.Println()
	fmt.Println(ui.Success(fmt.Sprintf("Created skillz.toon and %s", main)))
	fmt.Println()
	fmt.Println(ui.SubHeader("Next steps"))
	steps := []string{
		"Edit SKILL.md with your skill instructions",
		"Add dependencies: " + ui.Code("skillz add <skill-name>"),
		"Install dependencies: " + ui.Code("skillz install"),
	}
	fmt.Println(ui.NumberedList(steps))

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

	fmt.Println(ui.Header("Add Dependency"))
	fmt.Println(ui.Info("Adding: " + target))

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

		// Fetch latest version from registry
		client := registry.NewClient(registryURL)
		skillInfo, err := client.GetSkill(skillName)
		if err != nil {
			return fmt.Errorf("failed to fetch skill from registry: %w", err)
		}

		if len(skillInfo.Versions) == 0 {
			return fmt.Errorf("no versions found for skill: %s", skillName)
		}

		// Use the latest version (first in the array, since it's sorted by createdAt desc)
		latestVersion := skillInfo.Versions[0].Version
		depValue = "^" + latestVersion // Use caret range for semver

		fmt.Printf("Adding registry dependency: %s@%s\n", skillName, latestVersion)
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

	fmt.Println()
	fmt.Println(ui.Success(fmt.Sprintf("Added %s to %s", skillName, manifestPath)))
	fmt.Println(ui.Info("Run 'skillz install' to install the dependency"))

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

	fmt.Println(ui.Header(manifest.Name + "@" + manifest.Version))
	fmt.Println(ui.Info("Installing dependencies..."))
	fmt.Println()

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
		fmt.Println(ui.Info("No dependencies to install."))
		return nil
	}

	if len(rootDeps) > 0 {
		fmt.Println(ui.SubHeader("Resolving Dependencies"))
		fmt.Println(ui.Info(fmt.Sprintf("Resolving %d registry dependencies...", len(rootDeps))))

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
	fmt.Println()
	fmt.Println(ui.SubHeader("Installation Plan"))
	var rows [][]string
	for _, pkg := range plan {
		var name, version, source string
		name = pkg.Name
		if pkg.Location == "git" {
			version = ui.StyleMuted.Render(pkg.GitRef)
			source = ui.StyleCode.Render("git")
		} else {
			version = pkg.Version
			source = ui.StyleInfo.Render("registry")
		}
		rows = append(rows, []string{name, version, source})
	}
	table := ui.Table([]string{"Package", "Version", "Source"}, rows)
	fmt.Println(table)

	fmt.Println()
	fmt.Println(ui.SubHeader("Installing Packages"))

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

	fmt.Println()
	fmt.Println(ui.Success("Installation complete!"))

	return nil
}

func runUpdate(skillName string) error {
	if skillName == "" {
		fmt.Println(ui.Header("Update All Dependencies"))
	} else {
		fmt.Println(ui.Header("Update: " + skillName))
	}
	fmt.Println(ui.Warning("Not implemented yet"))
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

	fmt.Println(ui.Header("Remove Dependency"))
	fmt.Println(ui.Info("Removing: " + skillName))

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

	fmt.Println()
	fmt.Println(ui.Success(fmt.Sprintf("Removed %s from dependencies", skillName)))

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

	fmt.Println(ui.Header(manifest.Name + "@" + manifest.Version))

	// Dependencies
	if manifest.Dependencies != nil && len(manifest.Dependencies.Skills) > 0 {
		fmt.Println(ui.SubHeader("Dependencies"))

		var rows [][]string
		for name, dep := range manifest.Dependencies.Skills {
			var version string
			var depType string
			if v, ok := dep.(string); ok {
				version = v
				depType = ui.StyleInfo.Render("registry")
			} else {
				version = ui.StyleMuted.Render("(git)")
				depType = ui.StyleCode.Render("git")
			}
			rows = append(rows, []string{name, version, depType})
		}

		table := ui.Table([]string{"Name", "Version", "Type"}, rows)
		fmt.Println(table)
		fmt.Println()
	}

	// Dev Dependencies
	if manifest.DevDependencies != nil && len(manifest.DevDependencies.Skills) > 0 {
		fmt.Println(ui.SubHeader("Dev Dependencies"))

		var rows [][]string
		for name, dep := range manifest.DevDependencies.Skills {
			var version string
			var depType string
			if v, ok := dep.(string); ok {
				version = v
				depType = ui.StyleInfo.Render("registry")
			} else {
				version = ui.StyleMuted.Render("(git)")
				depType = ui.StyleCode.Render("git")
			}
			rows = append(rows, []string{name, version, depType})
		}

		table := ui.Table([]string{"Name", "Version", "Type"}, rows)
		fmt.Println(table)
		fmt.Println()
	}

	// MCP Servers
	if manifest.Dependencies != nil && len(manifest.Dependencies.MCPServers) > 0 {
		fmt.Println(ui.SubHeader("MCP Servers"))
		var items []string
		for name := range manifest.Dependencies.MCPServers {
			items = append(items, name)
		}
		fmt.Println(ui.List(items))
		fmt.Println()
	}

	// CLI Tools
	if manifest.Dependencies != nil && len(manifest.Dependencies.CLITools) > 0 {
		fmt.Println(ui.SubHeader("CLI Tools"))
		var rows [][]string
		for name, version := range manifest.Dependencies.CLITools {
			rows = append(rows, []string{name, version})
		}
		table := ui.Table([]string{"Name", "Version"}, rows)
		fmt.Println(table)
	}

	return nil
}

func runSearch(query string) error {
	fmt.Println(ui.Header("Search: " + query))

	client := registry.NewClient(registryURL)
	result, err := client.SearchSkills(query)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	if len(result.Skills) == 0 {
		fmt.Println(ui.Warning("No skills found."))
		return nil
	}

	fmt.Println(ui.Info(fmt.Sprintf("Found %d skill(s)", result.Total)))
	fmt.Println()

	for _, skill := range result.Skills {
		skillBox := ui.StyleBold.Render(ui.IconPackage + " " + skill.Name)
		if skill.Description != "" {
			skillBox += "\n" + ui.StyleMuted.Render("  "+skill.Description)
		}
		if skill.Author != "" {
			skillBox += "\n" + ui.StyleMuted.Render("  by "+skill.Author)
		}
		fmt.Println(ui.Box(skillBox))
		fmt.Println()
	}

	return nil
}

func runInfo(skillName string) error {
	fmt.Println(ui.Header("Skill Info: " + skillName))

	client := registry.NewClient(registryURL)
	result, err := client.GetSkill(skillName)
	if err != nil {
		return fmt.Errorf("failed to get skill info: %w", err)
	}

	// Display skill metadata
	fmt.Println(ui.KeyValue("Name", result.Name))
	fmt.Println(ui.KeyValue("Author", result.Author))
	fmt.Println(ui.KeyValue("Description", result.Description))
	fmt.Println()

	// Display versions
	if len(result.Versions) > 0 {
		fmt.Println(ui.SubHeader("Versions"))
		var rows [][]string
		for _, v := range result.Versions {
			rows = append(rows, []string{v.Version, v.CreatedAt})
		}
		table := ui.Table([]string{"Version", "Published"}, rows)
		fmt.Println(table)
		fmt.Println()
	}

	// Installation instructions
	fmt.Println(ui.SubHeader("Install"))
	fmt.Println(ui.Code("  skillz add " + skillName))

	return nil
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
