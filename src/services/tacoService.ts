// src/services/tacoService.ts

// A URL base pode ser configurada via variável de ambiente (ex: VITE_TACO_API_BASE no .env)
// Caso não exista, usamos o valor padrão para a API da TACO
const TACO_API_BASE = import.meta.env.VITE_TACO_API_BASE || 'https://taco-api.netlify.app/api/v1';

export interface TacoFoodBasic {
  id: number;
  description: string;
  category_id: number;
}

export interface TacoFoodDetails extends TacoFoodBasic {
  base_qty: number;
  base_unit: string;
  attributes: {
    protein?: { qty: number | string | "NA" | "Tr"; unit: string };
    carbohydrate?: { qty: number | string | "NA" | "Tr"; unit: string };
    lipid?: { qty: number | string | "NA" | "Tr"; unit: string };
    energy?: {
      kcal: number | string | "NA" | "Tr";
      kj: number | string | "NA" | "Tr";
    };
    [key: string]: any; // Outros nutrientes
  };
}

// Fallback caso a API falhe
const mockAlimentos: TacoFoodBasic[] = [
  { id: 1, description: "Arroz, integral, cozido", category_id: 1 },
  { id: 2, description: "Feijão, carioca, cozido", category_id: 2 },
  { id: 3, description: "Ovo, de galinha, inteiro, cozido", category_id: 3 }
];

const mockDetalhes: Record<number, TacoFoodDetails> = {
  1: {
    id: 1,
    description: "Arroz, integral, cozido",
    category_id: 1,
    base_qty: 100,
    base_unit: "g",
    attributes: {
      protein: { qty: 2.6, unit: "g" },
      carbohydrate: { qty: 25.8, unit: "g" },
      lipid: { qty: 1.0, unit: "g" },
      energy: { kcal: 124, kj: 519 }
    }
  },
  2: {
    id: 2,
    description: "Feijão, carioca, cozido",
    category_id: 2,
    base_qty: 100,
    base_unit: "g",
    attributes: {
      protein: { qty: 4.8, unit: "g" },
      carbohydrate: { qty: 13.6, unit: "g" },
      lipid: { qty: 0.5, unit: "g" },
      energy: { kcal: 76, kj: 318 }
    }
  }
};

export const tacoService = {
  // 1. Buscar todos os alimentos
  async listarAlimentos(): Promise<TacoFoodBasic[]> {
    try {
      const response = await fetch(`${TACO_API_BASE}/food`);
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn("Usando dados locais da TACO (API indisponível):", error);
      return mockAlimentos;
    }
  },

  // 2. Buscar detalhes de um alimento por ID
  async obterDetalhes(id: number): Promise<TacoFoodDetails | null> {
    try {
      const response = await fetch(`${TACO_API_BASE}/food/${id}`);
      if (!response.ok) throw new Error('Alimento não encontrado');
      
      // A API do TACO pode retornar um array para a busca por ID
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do alimento ${id}:`, error);
      console.warn("Usando fallback de detalhes locais.");
      return mockDetalhes[id] || null;
    }
  }
};
