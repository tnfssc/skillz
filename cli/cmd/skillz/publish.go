package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/tnfssc/skillz/cli/internal/auth"
	"github.com/tnfssc/skillz/cli/internal/packager"
	"github.com/tnfssc/skillz/cli/internal/parser"
	"github.com/tnfssc/skillz/cli/internal/registry"
	"github.com/tnfssc/skillz/cli/internal/ui"
)

var publishCmd = &cobra.Command{
	Use:   "publish",
	Short: "Publish the current skill to the registry",
	RunE:  runPublish,
}

func init() {
	rootCmd.AddCommand(publishCmd)
}

func runPublish(cmd *cobra.Command, args []string) error {
	// Check for skillz.toon
	manifestPath := "skillz.toon"
	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return fmt.Errorf("skillz.toon not found. Run 'skillz init' first")
	}

	// Parse manifest to get name and version
	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to parse manifest: %w", err)
	}

	fmt.Println(ui.Header("Publish Skill"))
	fmt.Println(ui.Info(fmt.Sprintf("Publishing %s@%s", manifest.Name, manifest.Version)))
	fmt.Println()

	// Load credentials
	creds, err := auth.LoadCredentials()
	if err != nil {
		return fmt.Errorf("failed to load credentials: %w", err)
	}
	if creds == nil || creds.Token == "" {
		return fmt.Errorf("not logged in. Run 'skillz login' first")
	}

	// Create tarball
	tarballName := fmt.Sprintf("%s-%s.tgz", manifest.Name, manifest.Version)
	tarballPath := filepath.Join(os.TempDir(), tarballName)

	fmt.Println(ui.SubHeader("Creating Package"))
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	if err := packager.CreateTarball(cwd, tarballPath); err != nil {
		return fmt.Errorf("failed to create tarball: %w", err)
	}
	defer func() { _ = os.Remove(tarballPath) }()

	// Publish
	fmt.Println()
	fmt.Println(ui.SubHeader("Uploading to Registry"))
	client := registry.NewClient(registryURL)
	if err := client.Publish(manifest.Name, manifest.Version, tarballPath, creds.Token); err != nil {
		return err
	}

	fmt.Println()
	fmt.Println(ui.Success(fmt.Sprintf("Successfully published %s@%s!", manifest.Name, manifest.Version)))
	return nil
}
