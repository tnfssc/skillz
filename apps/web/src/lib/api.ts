export interface Skill {
  id: number;
  name: string;
  description: string | null;
  author: string;
  authorId: string;
  repository: string | null;
  homepage: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillVersion {
  id: number;
  skillId: number;
  version: string;
  description: string | null;
  tarballUrl: string;
  integrity: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  skills: Skill[];
}

export interface SkillsResponse {
  skills: Skill[];
  total: number;
  limit: number;
  offset: number;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8787') + '/api/v1';

export const api = {
  async fetchSkills(params?: { limit?: number; offset?: number; q?: string }): Promise<SkillsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.q) searchParams.set('q', params.q);

    const response = await fetch(`${API_BASE}/skills?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch skills');
    }
    return response.json();
  },

  async fetchSkill(name: string): Promise<Skill & { versions: SkillVersion[] }> {
    const response = await fetch(`${API_BASE}/skills/${name}`);
    if (!response.ok) {
      throw new Error('Failed to fetch skill');
    }
    return response.json();
  },

  async fetchUser(username: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE}/users/${username}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }
};
