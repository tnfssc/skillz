package installer

import (
	"archive/tar"
	"compress/gzip"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/tnfssc/skillz/cli/internal/resolver"
)

func setupMockRegistry(t *testing.T) *httptest.Server {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gw := gzip.NewWriter(w)
		defer gw.Close()
		tw := tar.NewWriter(gw)
		defer tw.Close()

		body := []byte("hello world")
		hdr := &tar.Header{
			Name: "SKILL.md",
			Mode: 0600,
			Size: int64(len(body)),
		}
		if err := tw.WriteHeader(hdr); err != nil {
			t.Fatal(err)
		}
		if _, err := tw.Write(body); err != nil {
			t.Fatal(err)
		}
	}))
	return ts
}

func TestNewInstaller(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)

	if installer.rootDir != tmpDir {
		t.Errorf("expected rootDir %s, got %s", tmpDir, installer.rootDir)
	}
}

func TestEnsureDirectories(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)

	if err := installer.EnsureDirectories(); err != nil {
		t.Fatalf("failed to ensure directories: %v", err)
	}

	// Check that directories were created
	expectedDirs := []string{
		filepath.Join(tmpDir, SkillzDir),
		filepath.Join(tmpDir, SkillzDir, SkillsDir),
		filepath.Join(tmpDir, SkillzDir, CacheDir),
	}

	for _, dir := range expectedDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			t.Errorf("directory %s was not created", dir)
		}
	}
}

func TestIsInstalled(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)

	if err := installer.EnsureDirectories(); err != nil {
		t.Fatalf("failed to ensure directories: %v", err)
	}

	// Create a fake installed skill

	skillName := "test-skill"
	skillPath := filepath.Join(installer.SkillsPath(), skillName)
	if err := os.MkdirAll(skillPath, 0755); err != nil {
		t.Fatalf("failed to create skill directory: %v", err)
	}

	// Test installed skill
	if !installer.IsInstalled(skillName) {
		t.Error("expected skill to be installed")
	}

	// Test non-installed skill
	if installer.IsInstalled("non-existent-skill") {
		t.Error("expected skill to not be installed")
	}
}

func TestInstallSkill(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)
	ts := setupMockRegistry(t)
	defer ts.Close()

	skillName := "test-skill"
	version := "1.0.0"

	pkg := resolver.ResolvedPackage{
		Name:       skillName,
		Version:    version,
		Location:   "registry",
		TarballURL: ts.URL,
	}

	if err := installer.Install(pkg); err != nil {
		t.Fatalf("failed to install skill: %v", err)
	}

	// Verify skill directory was created
	if !installer.IsInstalled(skillName) {
		t.Error("skill should be installed after Install")
	}
}

func TestUninstallSkill(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)
	ts := setupMockRegistry(t)
	defer ts.Close()

	// Install a skill first
	skillName := "test-skill"
	version := "1.0.0"

	pkg := resolver.ResolvedPackage{
		Name:       skillName,
		Version:    version,
		Location:   "registry",
		TarballURL: ts.URL,
	}

	if err := installer.Install(pkg); err != nil {
		t.Fatalf("failed to install skill: %v", err)
	}

	// Uninstall it
	if err := installer.UninstallSkill(skillName); err != nil {
		t.Fatalf("failed to uninstall skill: %v", err)
	}

	// Verify it's gone
	if installer.IsInstalled(skillName) {
		t.Error("skill should not be installed after UninstallSkill")
	}
}

func TestUninstallSkill_NotInstalled(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)

	err := installer.UninstallSkill("non-existent-skill")
	if err == nil {
		t.Error("expected error when uninstalling non-existent skill")
	}
}

func TestListInstalled(t *testing.T) {
	tmpDir := t.TempDir()
	installer := NewInstaller(tmpDir)
	ts := setupMockRegistry(t)
	defer ts.Close()

	// Initially empty
	skills, err := installer.ListInstalled()
	if err != nil {
		t.Fatalf("failed to list installed skills: %v", err)
	}
	if len(skills) != 0 {
		t.Errorf("expected 0 skills, got %d", len(skills))
	}

	// Install some skills
	skillNames := []string{"skill-a", "skill-b", "skill-c"}
	for _, name := range skillNames {
		pkg := resolver.ResolvedPackage{
			Name:       name,
			Version:    "1.0.0",
			Location:   "registry",
			TarballURL: ts.URL,
		}
		if err := installer.Install(pkg); err != nil {
			t.Fatalf("failed to install %s: %v", name, err)
		}
	}

	// List them
	skills, err = installer.ListInstalled()
	if err != nil {
		t.Fatalf("failed to list installed skills: %v", err)
	}

	if len(skills) != len(skillNames) {
		t.Errorf("expected %d skills, got %d", len(skillNames), len(skills))
	}

	// Verify all skills are present
	skillMap := make(map[string]bool)
	for _, skill := range skills {
		skillMap[skill] = true
	}

	for _, name := range skillNames {
		if !skillMap[name] {
			t.Errorf("skill %s not found in list", name)
		}
	}
}
