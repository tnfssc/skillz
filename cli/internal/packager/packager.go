package packager

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// CreateTarball creates a .tgz file from the source directory
func CreateTarball(srcDir, destFile string) error {
	// Create output file
	fw, err := os.Create(destFile)
	if err != nil {
		return err
	}
	defer fw.Close()

	// Create gzip writer
	gw := gzip.NewWriter(fw)
	defer gw.Close()

	// Create tar writer
	tw := tar.NewWriter(gw)
	defer tw.Close()

	// Walk through source directory
	return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Get relative path
		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}

		// Skip root directory itself
		if relPath == "." {
			return nil
		}

		// Ignore common patterns
		if shouldIgnore(relPath) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Create tar header
		header, err := tar.FileInfoHeader(info, info.Name())
		if err != nil {
			return err
		}

		// Update header name to relative path
		header.Name = relPath

		// Write header
		if err := tw.WriteHeader(header); err != nil {
			return err
		}

		// Write file content
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			if _, err := io.Copy(tw, file); err != nil {
				return err
			}
		}

		return nil
	})
}

func shouldIgnore(path string) bool {
	// Normalize path separators
	path = filepath.ToSlash(path)

	// Ignore .git directory
	if strings.HasPrefix(path, ".git/") || path == ".git" {
		return true
	}

	// Ignore .skillz directory
	if strings.HasPrefix(path, ".skillz/") || path == ".skillz" {
		return true
	}

	// Ignore node_modules
	if strings.HasPrefix(path, "node_modules/") || path == "node_modules" {
		return true
	}

	// Ignore .DS_Store
	if strings.HasSuffix(path, ".DS_Store") {
		return true
	}

	return false
}
