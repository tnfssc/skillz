package resolver

import (
	"fmt"
	"strings"
	"testing"

	"github.com/Masterminds/semver/v3"
)

// MockProvider implements Provider for testing
type MockProvider struct {
	versions     map[string][]string
	dependencies map[string]map[string][]string // pkg -> version -> [dep@constraint]
}

func NewMockProvider() *MockProvider {
	return &MockProvider{
		versions:     make(map[string][]string),
		dependencies: make(map[string]map[string][]string),
	}
}

func (m *MockProvider) AddPackage(name string, versions []string) {
	m.versions[name] = versions
}

func (m *MockProvider) AddDependency(pkg, version, dep string) {
	if m.dependencies[pkg] == nil {
		m.dependencies[pkg] = make(map[string][]string)
	}
	m.dependencies[pkg][version] = append(m.dependencies[pkg][version], dep)
}

func (m *MockProvider) GetVersions(name string) ([]*semver.Version, error) {
	raw, ok := m.versions[name]
	if !ok {
		return nil, fmt.Errorf("package not found: %s", name)
	}

	var versions []*semver.Version
	for _, r := range raw {
		v, err := semver.NewVersion(r)
		if err != nil {
			return nil, err
		}
		versions = append(versions, v)
	}
	return versions, nil
}

func (m *MockProvider) GetDependencies(name string, version *semver.Version) ([]Dependency, error) {
	depsMap, ok := m.dependencies[name]
	if !ok {
		return nil, nil
	}
	
	rawDeps, ok := depsMap[version.String()]
	if !ok {
		return nil, nil
	}

	var deps []Dependency
	for _, d := range rawDeps {
		// Parse "name@constraint"
		parts := strings.Split(d, "@")
		depName := parts[0]
		constraintStr := parts[1]
		
		c, err := semver.NewConstraint(constraintStr)
		if err != nil {
			return nil, err
		}
		deps = append(deps, Dependency{
			Name:       depName,
			Constraint: c,
		})
	}
	return deps, nil
}

func (m *MockProvider) GetArtifact(name string, version *semver.Version) (*ArtifactInfo, error) {
	return &ArtifactInfo{
		Location:   "registry",
		Source:     "http://mock/" + name + "-" + version.String() + ".tgz",
		TarballURL: "http://mock/" + name + "-" + version.String() + ".tgz",
		Integrity:  "sha256-mock",
	}, nil
}

func TestResolver_Resolve(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(*MockProvider)
		rootDeps  []string // "name@constraint"
		want      []string // "name@version"
		wantErr   bool
	}{
		{
			name: "Simple chain A->B",
			setup: func(p *MockProvider) {
				p.AddPackage("A", []string{"1.0.0"})
				p.AddPackage("B", []string{"1.0.0", "1.1.0"})
				p.AddDependency("A", "1.0.0", "B@^1.0.0")
			},
			rootDeps: []string{"A@^1.0.0"},
			want:     []string{"A@1.0.0", "B@1.1.0"},
		},
		{
			name: "Diamond dependency success",
			setup: func(p *MockProvider) {
				p.AddPackage("Root", []string{"1.0.0"})
				p.AddPackage("Left", []string{"1.0.0"})
				p.AddPackage("Right", []string{"1.0.0"})
				p.AddPackage("Bottom", []string{"1.0.0", "1.1.0", "2.0.0"})

				p.AddDependency("Root", "1.0.0", "Left@^1.0.0")
				p.AddDependency("Root", "1.0.0", "Right@^1.0.0")
				p.AddDependency("Left", "1.0.0", "Bottom@^1.0.0")
				p.AddDependency("Right", "1.0.0", "Bottom@^1.0.0") // Both want ^1.0.0
			},
			rootDeps: []string{"Root@^1.0.0"},
			want:     []string{"Bottom@1.1.0", "Left@1.0.0", "Right@1.0.0", "Root@1.0.0"},
		},
		{
			name: "Conflict",
			setup: func(p *MockProvider) {
				p.AddPackage("Root", []string{"1.0.0"})
				p.AddPackage("Left", []string{"1.0.0"})
				p.AddPackage("Right", []string{"1.0.0"})
				p.AddPackage("Bottom", []string{"1.0.0", "2.0.0"})

				p.AddDependency("Root", "1.0.0", "Left@^1.0.0")
				p.AddDependency("Root", "1.0.0", "Right@^1.0.0")
				p.AddDependency("Left", "1.0.0", "Bottom@^1.0.0") // Wants 1.x
				p.AddDependency("Right", "1.0.0", "Bottom@^2.0.0") // Wants 2.x
			},
			rootDeps: []string{"Root@^1.0.0"},
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := NewMockProvider()
			tt.setup(p)
			r := NewResolver(p)

			var roots []Dependency
			for _, d := range tt.rootDeps {
				parts := strings.Split(d, "@")
				name := parts[0]
				constr := parts[1]
				c, _ := semver.NewConstraint(constr)
				roots = append(roots, Dependency{Name: name, Constraint: c})
			}

			got, err := r.Resolve(roots)
			if (err != nil) != tt.wantErr {
				t.Errorf("Resolve() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if len(got) != len(tt.want) {
					t.Errorf("Resolve() got %d packages, want %d", len(got), len(tt.want))
				}
				// Check contents
				gotMap := make(map[string]string)
				for _, pkg := range got {
					gotMap[pkg.Name] = pkg.Version
				}
				
				for _, w := range tt.want {
					parts := strings.Split(w, "@")
					name := parts[0]
					ver := parts[1]
					if gotVer, ok := gotMap[name]; !ok || gotVer != ver {
						t.Errorf("Resolve() missing or wrong version for %s: got %s, want %s", name, gotVer, ver)
					}
				}
			}
		})
	}
}
