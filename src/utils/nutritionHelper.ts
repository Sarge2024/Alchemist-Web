// src/utils/nutritionHelper.ts
//
// Utilitário para extrair dados nutricionais de receitas independentemente do formato.
// A API retorna: { nutrition: { total_nutrition: { calories, protein, carbs, fat }, details: [...] } }
// O tipo Recipe do frontend espera: { nutrition: { calories, protein, carbs, fat } }
// Receitas já normalizadas terão o formato flat; receitas vindas do Firestore podem ter o formato aninhado.

import { RecipeNutrition } from '../types';

/**
 * Extrai os macros de uma receita, independente de o campo `nutrition` estar
 * no formato flat (nutrition.calories) ou aninhado (nutrition.total_nutrition.calories).
 */
export function extractNutrition(recipe: any): RecipeNutrition {
  if (!recipe || !recipe.nutrition) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const raw = recipe.nutrition;
  const tn = raw.total_nutrition || raw;

  return {
    calories: Number(tn.calories) || 0,
    protein: Number(tn.protein) || 0,
    carbs: Number(tn.carbs) || 0,
    fat: Number(tn.fat) || 0,
  };
}
