import { IndustrialProduct, PaginatedResponse } from "../types";

const getApiBase = () => {
  const envBase = import.meta.env.VITE_DISHALCHEMISTS_API_BASE;
  if (envBase) {
    let resolvedBase = envBase;
    if (envBase.endsWith('/api')) {
      resolvedBase = `${envBase}/v1/public`;
    } else if (envBase.endsWith('/api/')) {
      resolvedBase = `${envBase}v1/public`;
    }
    return resolvedBase.replace('/v1/public', '/v1/products');
  }
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://dishalchemists.com/api/v1/products';
  }
  
  return '/api/v1/products';
};

const getApiKey = () => {
  const envKey = import.meta.env.VITE_DISHALCHEMISTS_API_KEY;
  if (!envKey || envKey.trim() === '' || envKey.trim() === 'YOUR_API_KEY_HERE') {
    return 'alchemist-app-secret-2024';
  }
  return envKey;
};

const API_BASE = getApiBase();
const API_KEY = getApiKey();

export const productService = {
  getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (API_KEY && API_BASE !== '/api/products') {
      headers['x-api-key'] = API_KEY;
    }
    return headers;
  },

  /**
   * Busca produto pelo código de barras (EAN-13 / UPC)
   */
  async getByBarcode(ean: string): Promise<{ success: boolean; product?: IndustrialProduct; error?: string }> {
    const response = await fetch(`${API_BASE}/barcode/${ean}`, {
      headers: this.getHeaders()
    });
    return response.json();
  },

  /**
   * Cadastra produto manualmente
   */
  async registerProduct(data: {
    name: string;
    brand?: string;
    barcode?: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    lipids: number;
    portionSize?: number;
    portionUnit?: string;
    imageUrl?: string;
    allergens?: string[];
    price?: number;
    totalPackageSize?: number;
    totalPackageUnit?: string;
  }): Promise<{ success: boolean; product?: IndustrialProduct; error?: string }> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Atualiza informações (preço, volume) de um produto existente
   */
  async updateProduct(id: string, data: {
    price?: number;
    totalPackageSize?: number;
    totalPackageUnit?: string;
    imageUrl?: string;
  }): Promise<{ success: boolean; product?: IndustrialProduct; error?: string }> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Lista produtos cadastrados com busca e paginação
   */
  async searchProducts(
    search?: string,
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data: IndustrialProduct[]; pagination: PaginatedResponse<IndustrialProduct>["pagination"] }> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: this.getHeaders()
    });
    return response.json();
  },
};
