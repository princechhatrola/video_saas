const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('videoforge_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('videoforge_token', token);
      } else {
        localStorage.removeItem('videoforge_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('videoforge_token');
    }
    return this.token;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ data: T; error?: any }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as any) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          data: null as any,
          error: json?.message || json?.error || `Request failed (${res.status})`,
        };
      }

      // The backend envelope is { success: true, data: ... }
      const payload = json && typeof json === 'object' && 'data' in json ? json.data : json;
      return { data: payload };
    } catch (err: any) {
      return { data: null as any, error: err.message || 'Network error' };
    }
  }

  // ── Auth ─────────────────────────────────────────────────────

  async register(name: string, email: string, password: string) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.data?.tokens?.accessToken) {
      this.setToken(res.data.tokens.accessToken);
    }
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.tokens?.accessToken) {
      this.setToken(res.data.tokens.accessToken);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // ── Providers & BYOK ─────────────────────────────────────────

  async getCatalog() {
    return this.request('/providers/catalog');
  }

  async getConnections() {
    return this.request('/providers/connections');
  }

  async createConnection(data: {
    providerId: string;
    label: string;
    apiKey: string;
    region?: string;
  }) {
    return this.request('/providers/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testConnection(id: string) {
    return this.request(`/providers/connections/${id}/test`, {
      method: 'POST',
    });
  }

  async deleteConnection(id: string) {
    return this.request(`/providers/connections/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Projects ─────────────────────────────────────────────────

  async createProject(data: {
    title: string;
    inputText: string;
    settings?: any;
    providerSelection?: any;
  }) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listProjects(page = 1, limit = 20) {
    return this.request(`/projects?page=${page}&limit=${limit}`);
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async generateScript(id: string) {
    return this.request(`/projects/${id}/script`, {
      method: 'POST',
    });
  }

  async startGeneration(id: string) {
    return this.request(`/projects/${id}/generate`, {
      method: 'POST',
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Dashboard ────────────────────────────────────────────────

  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }
}

export const api = new ApiClient();
