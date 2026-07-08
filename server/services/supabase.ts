import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface NutritionalData {
  id: string | number;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  source: 'TACO' | 'USDA' | 'RECEITA';
}

/**
 * Busca um alimento no Supabase usando similaridade textual (ILIKE) nas tabelas TACO/USDA ou Receitas.
 */
export async function findFoodInDatabase(foodName: string): Promise<NutritionalData | null> {
  try {
    // 1. Tenta buscar primeiro nas Fichas Técnicas / Receitas Próprias
    const { data: recipeData } = await supabase
      .from('recipes')
      .select('id, name, total_calories, total_carbs, total_protein, total_fat')
      .ilike('name', `%${foodName}%`)
      .limit(1)
      .single();

    if (recipeData) {
      return {
        id: recipeData.id,
        name: recipeData.name,
        calories_per_100g: recipeData.total_calories, // Assumindo que sua tabela já calcula por porção padrão ou 100g
        carbs_per_100g: recipeData.total_carbs,
        protein_per_100g: recipeData.total_protein,
        fat_per_100g: recipeData.total_fat,
        source: 'RECEITA'
      };
    }

    // 2. Se não achar em receitas, busca na tabela unificada da TACO/USDA
    const { data: foodData } = await supabase
      .from('food_nutrition_base') // Substitua pelo nome real da sua tabela da TACO/USDA
      .select('id, description, calories, carbohydrates, protein, lipids, origin_source')
      .ilike('description', `%${foodName}%`)
      .limit(1)
      .single();

    if (foodData) {
      return {
        id: foodData.id,
        name: foodData.description,
        calories_per_100g: Number(foodData.calories || 0),
        carbs_per_100g: Number(foodData.carbohydrates || 0),
        protein_per_100g: Number(foodData.protein || 0),
        fat_per_100g: Number(foodData.lipids || 0),
        source: foodData.origin_source === 'USDA' ? 'USDA' : 'TACO'
      };
    }

    return null;
  } catch (error) {
    console.warn(`Aviso: Busca exata não encontrada para o termo: "${foodName}".`);
    return null;
  }
}
