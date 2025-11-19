// Shared types used across API and Web

export interface SkillManifest {
    manifestVersion: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    dependencies?: Dependencies;
    devDependencies?: Dependencies;
    skill: SkillConfig;
}

export interface Dependencies {
    skills?: Record<string, string | SkillDependency>;
    'mcp-servers'?: Record<string, string | MCPServerDependency>;
    'cli-tools'?: Record<string, string>;
}

export interface SkillDependency {
    version?: string;
    git?: string;
    branch?: string;
    tag?: string;
    path?: string;
}

export interface MCPServerDependency {
    version?: string;
    config?: Record<string, unknown>;
}

export interface SkillConfig {
    main: string;
    requires?: string[];
    exports?: string[];
}

export interface SkillMetadata {
    id: number;
    name: string;
    version: string;
    description: string;
    author: string;
    downloads: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SearchResult {
    skill: SkillMetadata;
    score: number;
}
