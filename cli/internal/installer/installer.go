package installer

import (
	"archive/tar"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	gitpkg "github.com/tnfssc/skillz/cli/internal/git"
	"github.com/tnfssc/skillz/cli/internal/parser"
	"github.com/tnfssc/skillz/cli/internal/resolver"
)

const (
	SkillzDir = ".skillz"
	SkillsDir = "skills"
	CacheDir  = "cache"
	GlobalDir = "global"
)

// Installer handles skill installation
type Installer struct {
	rootDir string
}

// NewInstaller creates a new installer instance
func NewInstaller(rootDir string) *Installer {
	if rootDir == "" {
		rootDir = "."
	}
	return &Installer{rootDir: rootDir}
}

// EnsureDirectories creates necessary directory structure
func (i *Installer) EnsureDirectories() error {
	dirs := []string{
		filepath.Join(i.rootDir, SkillzDir),
		filepath.Join(i.rootDir, SkillzDir, SkillsDir),
		filepath.Join(i.rootDir, SkillzDir, CacheDir),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return nil
}

// SkillsPath returns the path to the skills directory
func (i *Installer) SkillsPath() string {
	return filepath.Join(i.rootDir, SkillzDir, SkillsDir)
}

// CachePath returns the path to the cache directory
func (i *Installer) CachePath() string {
	return filepath.Join(i.rootDir, SkillzDir, CacheDir)
}

// IsInstalled checks if a skill is already installed
func (i *Installer) IsInstalled(skillName string) bool {
	skillPath := filepath.Join(i.SkillsPath(), skillName)
	_, err := os.Stat(skillPath)
	return err == nil
}

// GetInstalledVersion returns the version of an installed skill
func (i *Installer) GetInstalledVersion(skillName string) (string, error) {
	manifestPath := filepath.Join(i.SkillsPath(), skillName, "skillz.toon")

	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		return "", fmt.Errorf("skill not installed")
	}

	// Parse the manifest to get version
	manifest, err := parser.ParseManifest(manifestPath)
	if err != nil {
		return "", fmt.Errorf("failed to parse manifest: %w", err)
	}

	return manifest.Version, nil
}

// Install installs a resolved package
func (i *Installer) Install(pkg resolver.ResolvedPackage) error {
	if err := i.EnsureDirectories(); err != nil {
		return err
	}

	fmt.Printf("Installing %s@%s...\n", pkg.Name, pkg.Version)

	switch pkg.Location {
	case "registry":
		return i.installFromRegistry(pkg)
	case "git":
		return i.installFromGit(pkg)
	}

	return fmt.Errorf("unsupported package location: %s", pkg.Location)
}

func (i *Installer) installFromGit(pkg resolver.ResolvedPackage) error {
	if pkg.GitURL == "" {
		return fmt.Errorf("no git URL for %s", pkg.Name)
	}

	// Define paths
	gitCacheDir := filepath.Join(i.CachePath(), "git", pkg.Name)
	if pkg.GitRef != "" {
		gitCacheDir = filepath.Join(gitCacheDir, pkg.GitRef)
	}
	installPath := filepath.Join(i.SkillsPath(), pkg.Name)

	// Clone if not cached
	if _, err := os.Stat(gitCacheDir); os.IsNotExist(err) {
		fmt.Printf("  Cloning %s...\n", pkg.GitURL)
		if err := os.MkdirAll(filepath.Dir(gitCacheDir), 0755); err != nil {
			return fmt.Errorf("failed to create git cache dir: %w", err)
		}

		if err := gitpkg.Clone(pkg.GitURL, gitCacheDir, pkg.GitRef); err != nil {
			return fmt.Errorf("git clone failed: %w", err)
		}
	} else {
		fmt.Println("  Using cached git repository")
	}

	// Copy from git cache to install location
	fmt.Println("  Installing from git...")

	// Remove existing installation
	os.RemoveAll(installPath)

	// Copy directory
	if err := copyDir(gitCacheDir, installPath); err != nil {
		return fmt.Errorf("failed to copy from git cache: %w", err)
	}

	return nil
}

func (i *Installer) installFromRegistry(pkg resolver.ResolvedPackage) error {
	if pkg.TarballURL == "" {
		return fmt.Errorf("no tarball URL for %s@%s", pkg.Name, pkg.Version)
	}

	// Define paths
	tarballName := fmt.Sprintf("%s-%s.tgz", pkg.Name, pkg.Version)
	cachePath := filepath.Join(i.CachePath(), tarballName)
	installPath := filepath.Join(i.SkillsPath(), pkg.Name)

	// 1. Download to cache if not exists
	if _, err := os.Stat(cachePath); os.IsNotExist(err) {
		fmt.Printf("  Downloading %s...\n", pkg.TarballURL)
		if err := i.downloadFile(pkg.TarballURL, cachePath); err != nil {
			return fmt.Errorf("download failed: %w", err)
		}
	} else {
		fmt.Println("  Using cached package")
	}

	// 2. Verify integrity (if provided)
	if pkg.Integrity != "" {
		fmt.Println("  Verifying integrity...")
		if err := verifyChecksum(cachePath, pkg.Integrity); err != nil {
			return fmt.Errorf("integrity check failed for %s: %w", pkg.Name, err)
		}
	}

	// 3. Extract
	fmt.Println("  Extracting...")

	// Remove existing installation if any
	os.RemoveAll(installPath)

	// Extract
	if err := i.extractTarball(cachePath, installPath); err != nil {
		return fmt.Errorf("failed to extract %s: %w", pkg.Name, err)
	}

	return nil
}

func verifyChecksum(path, integrity string) error {
	parts := strings.SplitN(integrity, "-", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid integrity format: %s", integrity)
	}
	algo, expectedHash := parts[0], parts[1]

	if algo != "sha256" {
		return fmt.Errorf("unsupported hash algorithm: %s", algo)
	}

	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return err
	}

	actualHash := hex.EncodeToString(hasher.Sum(nil))
	if actualHash != expectedHash {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedHash, actualHash)
	}

	return nil
}

func (i *Installer) downloadFile(url, dest string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned %s", resp.Status)
	}

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func (i *Installer) extractTarball(src, dest string) error {
	// Open tarball
	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer f.Close()

	// Create gzip reader
	gzr, err := gzip.NewReader(f)
	if err != nil {
		return err
	}
	defer gzr.Close()

	// Create tar reader
	tr := tar.NewReader(gzr)

	// Ensure destination exists
	if err := os.MkdirAll(dest, 0755); err != nil {
		return err
	}

	// Iterate through files
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// Strip "package/" prefix if present (npm style)
		// or just use the name.
		// For now, let's assume flat or standard structure.
		// But usually tarballs have a root dir.
		// Let's strip the first component if it's a directory?
		// Or just extract as is?
		// If we extract to `dest`, and tarball has `package/foo.js`, it goes to `dest/package/foo.js`.
		// We probably want `dest/foo.js`.

		target := filepath.Join(dest, header.Name)

		// Check for ZipSlip
		if !strings.HasPrefix(filepath.Clean(target), filepath.Clean(dest)) {
			return fmt.Errorf("illegal file path: %s", header.Name)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0755); err != nil {
				return err
			}
		case tar.TypeReg:
			// Create parent dir if needed
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}

			f, err := os.Create(target)
			if err != nil {
				return err
			}

			if _, err := io.Copy(f, tr); err != nil {
				f.Close()
				return err
			}
			f.Close()

			// Set permissions
			// os.Chmod(target, os.FileMode(header.Mode))
		}
	}

	return nil
}

// UninstallSkill removes an installed skill
func (i *Installer) UninstallSkill(skillName string) error {
	skillPath := filepath.Join(i.SkillsPath(), skillName)

	if !i.IsInstalled(skillName) {
		return fmt.Errorf("skill %s is not installed", skillName)
	}

	if err := os.RemoveAll(skillPath); err != nil {
		return fmt.Errorf("failed to remove skill: %w", err)
	}

	fmt.Printf("Uninstalled %s\n", skillName)
	return nil
}

// ListInstalled returns a list of installed skills
func (i *Installer) ListInstalled() ([]string, error) {
	skillsPath := i.SkillsPath()

	if _, err := os.Stat(skillsPath); os.IsNotExist(err) {
		return []string{}, nil
	}

	entries, err := os.ReadDir(skillsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read skills directory: %w", err)
	}

	var skills []string
	for _, entry := range entries {
		if entry.IsDir() {
			skills = append(skills, entry.Name())
		}
	}

	return skills, nil
}

// copyDir recursively copies a directory
func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Get relative path
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}

		// Skip .git directory
		if strings.HasPrefix(relPath, ".git") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, info.Mode())
		}

		// Copy file
		sourceFile, err := os.Open(path)
		if err != nil {
			return err
		}
		defer sourceFile.Close()

		targetFile, err := os.Create(targetPath)
		if err != nil {
			return err
		}
		defer targetFile.Close()

		if _, err := io.Copy(targetFile, sourceFile); err != nil {
			return err
		}

		return os.Chmod(targetPath, info.Mode())
	})
}
