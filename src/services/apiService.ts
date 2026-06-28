// src/services/apiService.ts
import { Recipe, PaginatedResponse, RecipeCategories } from "../types";

// Base URL para o BFF (BFF lida com a chave x-api-key e o proxy)
const API_BASE = '/api';

export const apiService = {
  getHeaders(firebaseToken?: string) {
    return {
      'Content-Type': 'application/json',
      ...(firebaseToken ? { 'Authorization': `Bearer ${firebaseToken}` } : {})
    };
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
    const res = await fetch(`${API_BASE}/recipes/search?${params.toString()}`, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro na busca: ${res.statusText}`);
    return res.json();
  },

  async getCategories(firebaseToken?: string): Promise<RecipeCategories> {
    const res = await fetch(`${API_BASE}/categories`, { headers: this.getHeaders(firebaseToken) });
    if (!res.ok) throw new Error(`Erro ao buscar categorias: ${res.statusText}`);
    return res.json();
  }
};
