package git

import (
	"fmt"
	"os/exec"
	"strings"
)

// Clone clones a git repository to the specified destination
// If ref is provided, it checks out that ref (tag, branch, or commit)
func Clone(url, dest, ref string) error {
	// Check if git is available
	if _, err := exec.LookPath("git"); err != nil {
		return fmt.Errorf("git is not installed or not in PATH")
	}

	// Clone with depth 1 for efficiency (shallow clone)
	args := []string{"clone"}
	if ref != "" {
		// If ref is specified, clone with --branch (works for tags and branches)
		args = append(args, "--branch", ref)
	}
	args = append(args, "--depth", "1", url, dest)

	cmd := exec.Command("git", args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git clone failed: %s", string(output))
	}

	return nil
}

// GetCommitSHA returns the current commit SHA of a git repository
func GetCommitSHA(repoPath string) (string, error) {
	cmd := exec.Command("git", "rev-parse", "HEAD")
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get commit SHA: %w", err)
	}

	return strings.TrimSpace(string(output)), nil
}

// GetCurrentRef returns the current branch or tag name
func GetCurrentRef(repoPath string) (string, error) {
	// Try to get tag first
	cmd := exec.Command("git", "describe", "--exact-match", "--tags", "HEAD")
	cmd.Dir = repoPath

	if output, err := cmd.Output(); err == nil {
		return strings.TrimSpace(string(output)), nil
	}

	// If not a tag, get branch name
	cmd = exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	cmd.Dir = repoPath

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get current ref: %w", err)
	}

	branch := strings.TrimSpace(string(output))
	if branch == "HEAD" {
		// Detached HEAD state, return empty
		return "", nil
	}

	return branch, nil
}
