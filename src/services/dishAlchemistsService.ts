// src/services/dishAlchemistsService.ts

// Configurações da API proprietária
// Agora aponta para a própria API (Express backend)
const API_BASE = '/api';

// ==========================================
// INTERFACES (Formato JSON Esperado da API)
// ==========================================

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  taco_id?: number; // Referência opcional à tabela TACO para buscar as calorias exatas
  default_unit: string;
  nutrition_per_100g?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DishRecipe {
  id: string;
  title: string;
  description: string;
  category: string; // Ex: 'CETOGÊNICA', 'ALTA PROTEÍNA'
  prep_time_minutes: number;
  image_url: string;
  ingredients: {
    ingredient: Ingredient;
    quantity: number;
    unit: string; // Ex: 'g', 'ml', 'xícara', 'colher de sopa'
  }[];
  instructions: string[];
  total_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// ==========================================
// MOCK DATA (Fallback Local para Desenvolvimento)
// ==========================================

const mockIngredients: Ingredient[] = [
  {
    id: "ing_1",
    name: "Frango Desfiado",
    category: "Carnes",
    default_unit: "g",
    nutrition_per_100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }
  },
  {
    id: "ing_2",
    name: "Abacate",
    category: "Frutas",
    default_unit: "unidade",
    nutrition_per_100g: { calories: 160, protein: 2, carbs: 8.5, fat: 14.7 }
  }
];

const mockRecipes: DishRecipe[] = [
  {
    id: "rec_1",
    title: "Salada Alquimista de Abacate e Frango",
    description: "Uma salada cetogênica rica em gorduras boas e alta proteína.",
    category: "CETOGÊNICA",
    prep_time_minutes: 15,
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    ingredients: [
      { ingredient: mockIngredients[0], quantity: 150, unit: "g" },
      { ingredient: mockIngredients[1], quantity: 0.5, unit: "unidade" }
    ],
    instructions: [
      "Cozinhe o peito de frango e desfie.",
      "Corte o abacate em cubos.",
      "Misture tudo com azeite, sal e limão a gosto."
    ],
    total_nutrition: {
      calories: 327,
      protein: 47,
      carbs: 4,
      fat: 12
    }
  }
];

// ==========================================
// SERVIÇO DE COMUNICAÇÃO
// ==========================================

export const dishAlchemistsService = {
  
  // Headers de autenticação com Firebase
  // Importante: No frontend, o token precisa ser recuperado dinamicamente via getAuth() do Firebase
  getHeaders(firebaseToken?: string) {
    return {
      'Content-Type': 'application/json',
      ...(firebaseToken ? { 'Authorization': `Bearer ${firebaseToken}` } : {})
    };
  },

  // 1. Buscar todas as receitas (pode receber filtros no futuro)
  async getRecipes(firebaseToken?: string): Promise<DishRecipe[]> {
    try {
      const response = await fetch(`${API_BASE}/recipes`, { headers: this.getHeaders(firebaseToken) });
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn("API DishAlchemists indisponível. Usando fallback de Receitas (Mock).", error);
      return mockRecipes;
    }
  },

  // 2. Buscar receita específica por ID
  async getRecipeById(id: string, firebaseToken?: string): Promise<DishRecipe | null> {
    try {
      const response = await fetch(`${API_BASE}/recipes/${id}`, { headers: this.getHeaders(firebaseToken) });
      if (!response.ok) throw new Error("Receita não encontrada");
      return await response.json();
    } catch (error) {
      console.warn(`Fallback local ativado para a receita ${id}`);
      return mockRecipes.find(r => r.id === id) || null;
    }
  },

  // 3. Buscar banco de ingredientes base
  async getIngredients(firebaseToken?: string): Promise<Ingredient[]> {
    try {
      const response = await fetch(`${API_BASE}/ingredients`, { headers: this.getHeaders(firebaseToken) });
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn("API DishAlchemists indisponível. Usando fallback de Ingredientes (Mock).", error);
      return mockIngredients;
    }
  }
};

