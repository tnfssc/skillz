package e2e

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const (
	apiURL = "http://localhost:8787/api/v1"
)

func TestAuthAndPublishFlow(t *testing.T) {
	// 1. Build CLI
	cliPath, err := buildCLI()
	if err != nil {
		t.Fatalf("Failed to build CLI: %v", err)
	}
	defer os.Remove(cliPath)

	// 2. Setup Test Environment
	tmpDir, err := os.MkdirTemp("", "skillz-e2e-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Set HOME to tmpDir to isolate credentials
	os.Setenv("HOME", tmpDir)

	// 3. Test Login
	t.Run("Login", func(t *testing.T) {
		cmd := exec.Command(cliPath, "login", "-u", "alice", "-p", "password")
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("Login failed: %v\nOutput: %s", err, output)
		}

		// Verify credentials file
		credsPath := filepath.Join(tmpDir, ".skillz", "credentials.json")
		if _, err := os.Stat(credsPath); os.IsNotExist(err) {
			t.Errorf("Credentials file not created at %s", credsPath)
		}
	})

	// 4. Test Publish (Producer)
	producerDir := filepath.Join(tmpDir, "producer-skill")
	if err := os.Mkdir(producerDir, 0755); err != nil {
		t.Fatalf("Failed to create producer dir: %v", err)
	}

	t.Run("Publish", func(t *testing.T) {
		// Create skill files
		createFile(t, filepath.Join(producerDir, "skillz.yaml"), `
name: e2e-test-skill
version: 1.0.0
manifest-version: '1'
skill:
  main: SKILL.md
`)
		createFile(t, filepath.Join(producerDir, "SKILL.md"), "# E2E Test Skill")

		// Run publish
		cmd := exec.Command(cliPath, "publish")
		cmd.Dir = producerDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("Publish failed: %v\nOutput: %s", err, output)
		}

		if !strings.Contains(string(output), "Successfully published") {
			t.Errorf("Expected success message, got: %s", output)
		}
	})

	// 5. Test Install (Consumer)
	consumerDir := filepath.Join(tmpDir, "consumer-project")
	if err := os.Mkdir(consumerDir, 0755); err != nil {
		t.Fatalf("Failed to create consumer dir: %v", err)
	}

	t.Run("Install", func(t *testing.T) {
		// Create consumer manifest
		createFile(t, filepath.Join(consumerDir, "skillz.yaml"), `
name: e2e-consumer
version: 1.0.0
manifest-version: '1'
skill:
  main: SKILL.md
dependencies:
  skills:
    e2e-test-skill: 1.0.0
`)
		createFile(t, filepath.Join(consumerDir, "SKILL.md"), "# Consumer")

		// Run install
		cmd := exec.Command(cliPath, "install")
		cmd.Dir = consumerDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("Install failed: %v\nOutput: %s", err, output)
		}

		// Verify installed files
		installedSkillPath := filepath.Join(consumerDir, ".skillz", "skills", "e2e-test-skill", "SKILL.md")
		if _, err := os.Stat(installedSkillPath); os.IsNotExist(err) {
			t.Errorf("Installed skill file not found at %s", installedSkillPath)
		}

		// Verify lockfile was created
		lockfilePath := filepath.Join(consumerDir, "skillz.lock")
		if _, err := os.Stat(lockfilePath); os.IsNotExist(err) {
			t.Errorf("Lockfile not found at %s", lockfilePath)
		}

		// Verify lockfile contains integrity hash
		lockfileData, err := os.ReadFile(lockfilePath)
		if err != nil {
			t.Fatalf("Failed to read lockfile: %v", err)
		}
		if !strings.Contains(string(lockfileData), "integrity: sha256-") {
			t.Errorf("Lockfile missing integrity hash")
		}
		if !strings.Contains(string(lockfileData), "e2e-test-skill") {
			t.Errorf("Lockfile missing package entry")
		}
	})

	// 6. Test Integrity Verification (Corrupted tarball should fail)
	t.Run("IntegrityCheck", func(t *testing.T) {
		// Corrupt the cached tarball
		cachePath := filepath.Join(consumerDir, ".skillz", "cache", "e2e-test-skill-1.0.0.tgz")
		if err := os.WriteFile(cachePath, []byte("corrupted"), 0644); err != nil {
			t.Fatalf("Failed to corrupt tarball: %v", err)
		}

		// Remove installed files to force re-extraction
		installedPath := filepath.Join(consumerDir, ".skillz", "skills", "e2e-test-skill")
		os.RemoveAll(installedPath)

		// Run install - should fail due to checksum mismatch
		cmd := exec.Command(cliPath, "install")
		cmd.Dir = consumerDir
		output, err := cmd.CombinedOutput()
		if err == nil {
			t.Errorf("Expected install to fail with corrupted tarball, but it succeeded")
		}
		if !strings.Contains(string(output), "integrity check failed") {
			t.Errorf("Expected integrity check error, got: %s", output)
		}
	})

	// 7. Test Git Dependency Installation
	t.Run("GitDependency", func(t *testing.T) {
		gitConsumerDir := filepath.Join(tmpDir, "git-consumer")
		if err := os.Mkdir(gitConsumerDir, 0755); err != nil {
			t.Fatalf("Failed to create git consumer dir: %v", err)
		}

		// Create manifest with git dependency
		// Using a small, stable public repo
		createFile(t, filepath.Join(gitConsumerDir, "skillz.yaml"), `
name: git-consumer
version: 1.0.0
manifest-version: '1'
skill:
  main: SKILL.md
dependencies:
  skills:
    test-git-skill:
      git: https://github.com/octocat/Hello-World.git
      ref: master
`)
		createFile(t, filepath.Join(gitConsumerDir, "SKILL.md"), "# Git Consumer")

		// Run install
		cmd := exec.Command(cliPath, "install")
		cmd.Dir = gitConsumerDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("Install with git dependency failed: %v\nOutput: %s", err, output)
		}

		// Verify git dependency was installed
		gitSkillPath := filepath.Join(gitConsumerDir, ".skillz", "skills", "test-git-skill", "README")
		if _, err := os.Stat(gitSkillPath); os.IsNotExist(err) {
			t.Errorf("Git dependency not installed at %s", gitSkillPath)
		}

		// Verify lockfile includes git metadata
		lockfilePath := filepath.Join(gitConsumerDir, "skillz.lock")
		lockfileData, err := os.ReadFile(lockfilePath)
		if err != nil {
			t.Fatalf("Failed to read lockfile: %v", err)
		}
		lockfileStr := string(lockfileData)
		if !strings.Contains(lockfileStr, "gitUrl: https://github.com/octocat/Hello-World.git") {
			t.Errorf("Lockfile missing gitUrl")
		}
		if !strings.Contains(lockfileStr, "gitRef: master") {
			t.Errorf("Lockfile missing gitRef")
		}
		if !strings.Contains(lockfileStr, "test-git-skill:") {
			t.Errorf("Lockfile missing git package entry")
		}
	})
}

func buildCLI() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Assuming we are running from project root or cli/e2e
	// Let's find the cli directory
	projectRoot := findProjectRoot(cwd)
	cliDir := filepath.Join(projectRoot, "cli")
	outputPath := filepath.Join(os.TempDir(), fmt.Sprintf("skillz-e2e-%d", time.Now().Unix()))

	cmd := exec.Command("go", "build", "-o", outputPath, "./cmd/skillz")
	cmd.Dir = cliDir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("build failed: %s (err: %v)", output, err)
	}

	return outputPath, nil
}

func findProjectRoot(start string) string {
	dir := start
	for {
		// Check for go.work which should be at the root of the workspace
		if _, err := os.Stat(filepath.Join(dir, "go.work")); err == nil {
			return dir
		}
		// Check for packages directory which is at the root
		if _, err := os.Stat(filepath.Join(dir, "packages")); err == nil {
			return dir
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// We reached root and didn't find it.
			// Fallback: assume we are in cli/e2e and need to go up two levels to root
			// or one level to cli root?
			// Let's try to find where 'cli' directory is a child
			return start // This was the bug, returning start.
		}
		dir = parent
	}
}

func createFile(t *testing.T, path, content string) {
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create file %s: %v", path, err)
	}
}
