import { IndustrialProduct, PaginatedResponse } from "../types";

const API_BASE = "/api/products";

export const productService = {
  /**
   * Busca produto pelo código de barras (EAN-13 / UPC)
   */
  async getByBarcode(ean: string): Promise<{ success: boolean; product?: IndustrialProduct; error?: string }> {
    const response = await fetch(`${API_BASE}/barcode/${ean}`);
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
  }): Promise<{ success: boolean; product?: IndustrialProduct; error?: string }> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    return response.json();
  },
};
