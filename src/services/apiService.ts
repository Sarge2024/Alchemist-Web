// src/services/apiService.ts
import { Recipe, PaginatedResponse, RecipeCategories } from "../types";

// Todas as requisições passam pelo BFF (proxy Vite → server.ts :3001)
// O BFF injeta o x-api-key server-side — a API Key NUNCA é exposta no browser
// Base URL para o BFF (BFF lida com a chave x-api-key e o proxy)
// Em produção (Vercel), podemos usar a URL direta do backend configurada via VITE_DISHALCHEMISTS_API_BASE
const getApiBase = () => {
  const envBase = import.meta.env.VITE_DISHALCHEMISTS_API_BASE;
  if (envBase) {
    if (envBase.endsWith('/api')) {
      return `${envBase}/v1/public`;
    }
    if (envBase.endsWith('/api/')) {
      return `${envBase}v1/public`;
    }
    return envBase;
  }
  
  // Se estiver rodando na Vercel (ou qualquer outro host de produção), direcionamos para o domínio de produção oficial
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://dishalchemists.com/api/v1/public';
  }
  
  return '/api';
};

const API_BASE = getApiBase();
const API_KEY = import.meta.env.VITE_DISHALCHEMISTS_API_KEY || 'alchemist-app-secret-2024';

export const apiService = {
  API_BASE,
  getHeaders(firebaseToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (firebaseToken) {
      headers['Authorization'] = `Bearer ${firebaseToken}`;
    }
    if (API_KEY && API_BASE !== '/api') {
      headers['x-api-key'] = API_KEY;
    }
    return headers;
  },

  async getRecipes(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    category?: string; 
    difficulty?: string;
  }, firebaseToken?: string): Promise<PaginatedResponse<Recipe>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'TODAS') query.set('category', params.category);
    if (params?.difficulty) query.set('difficulty', params.difficulty);

    const url = `${API_BASE}/recipes${query.toString() ? '?' + query.toString() : ''}`;
    
    const res = await fetch(url, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro ao buscar receitas: ${res.statusText}`);
    return res.json();
  },

  async getRecipeById(id: string, firebaseToken?: string): Promise<{ data: Recipe }> {
    const res = await fetch(`${API_BASE}/recipes/${id}`, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro ao buscar receita ${id}: ${res.statusText}`);
    return res.json();
  },

  async searchRecipes(query: string, limit = 10, firebaseToken?: string): Promise<{ data: Recipe[], total: number }> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const isBff = API_BASE === '/api';
    const url = isBff
      ? `${API_BASE}/recipes/search?${params.toString()}`
      : `${API_BASE}/search?${params.toString()}`;
    const res = await fetch(url, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro na busca: ${res.statusText}`);
    return res.json();
  },

  async getCategories(firebaseToken?: string): Promise<RecipeCategories> {
    const res = await fetch(`${API_BASE}/categories`, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro ao buscar categorias: ${res.statusText}`);
    return res.json();
  }
};
