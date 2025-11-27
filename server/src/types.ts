// Database schema types
export interface Skill {
  id: number;
  name: string;
  description: string | null;
  author: string;
  authorId: string;
  repository: string | null;
  homepage: string | null;
  license: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date | string;
}

export interface SkillVersion {
  id: number;
  skillId: number;
  version: string;
  description: string | null;
  tarballUrl: string;
  integrity: string | null;
  manifest: string | Record<string, unknown>;
  createdAt: Date | string;
}

// User type from better-auth
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Component prop types
export interface HTMLAttributes {
  class?: string;
  id?: string;
  style?: string;
  onClick?: (e: Event) => void;
  onSubmit?: (e: Event) => void;
  [key: string]: unknown;
}
