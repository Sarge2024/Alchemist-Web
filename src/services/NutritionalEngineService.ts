// src/services/NutritionalEngineService.ts
// 
// PROXY CLIENT — Este serviço delega o cálculo nutricional ao BFF/backend,
// onde process.env funciona e as APIs externas (TACO + USDA) são acessíveis
// com suas respectivas API Keys.

import { apiService } from './apiService';

export interface IngredientQuery {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalResult {
  ingredient: string;
  source: 'TACO' | 'USDA' | 'LOCAL' | 'NOT_FOUND';
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  base_data?: any;
}

export class NutritionalEngineService {
  /**
   * Ponto de entrada do Motor. Envia a lista de ingredientes ao BFF,
   * que proxeia para o backend Alchemist (onde TACO + USDA são consultadas server-side).
   */
  public static async calculateRecipeNutrition(ingredients: IngredientQuery[], firebaseToken?: string): Promise<{
    total_nutrition: { calories: number; protein: number; carbs: number; fat: number; },
    details: NutritionalResult[]
  }> {
    try {
      const isBff = apiService.API_BASE === '/api';
      const url = isBff 
        ? '/api/nutrition/calculate' 
        : `${apiService.API_BASE.replace('/api/v1/public', '')}/api/nutrition/calculate`;

      const response = await fetch(url, {
        method: 'POST',
        headers: apiService.getHeaders(firebaseToken),
        body: JSON.stringify({ ingredients })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
      }

      const result = await response.json();

      return {
        total_nutrition: result.total_nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        details: result.details || []
      };
    } catch (error) {
      console.error('[NutritionalEngine] Erro ao calcular nutrição via BFF:', error);
      
      // Fallback: retorna zeros para não quebrar a UI
      return {
        total_nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        details: ingredients.map(ing => ({
          ingredient: ing.name,
          source: 'NOT_FOUND' as const,
          quantity: ing.quantity,
          unit: ing.unit,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }))
      };
    }
  }
}
