/**
 * Tabela de referência de densidades médias por grupo alimentar da TACO.
 * O valor representa a quantidade aproximada em gramas (g) de 1 colher de sopa cheia (15ml).
 * 
 * Esses valores são estimativas genéricas que servem como fallback quando 
 * o peso específico da colher não é fornecido na receita ou ingrediente.
 */
export const FoodGroupDensities: Record<string, number> = {
  "Cereais e derivados": 15,
  "Verduras, hortaliças e derivados": 10,
  "Frutas e derivados": 15,
  "Óleos e gorduras": 13,
  "Carnes e derivados": 20,
  "Leite e derivados": 15, // líquidos (~15g) e em pó (~10g) variam, média 15g.
  "Bebidas": 15,
  "Ovos e derivados": 15,
  "Leguminosas e derivados": 18,
  "Nozes e sementes": 12,
  "Açúcares e doces": 18,
  "Miscelâneas": 10,
  "Outros alimentos industrializados": 15,
  "Alimentos preparados": 18
};

const DEFAULT_TABLESPOON_WEIGHT = 15; // 15g por padrão (água)

/**
 * Retorna o peso estimado de uma colher de sopa em gramas para um dado grupo alimentar.
 * Se o grupo não for encontrado, retorna o padrão de 15g.
 */
export function getTablespoonWeightForGroup(groupName?: string): number {
  if (!groupName) return DEFAULT_TABLESPOON_WEIGHT;
  
  // Tenta encontrar uma correspondência exata ou parcial
  const exactMatch = FoodGroupDensities[groupName];
  if (exactMatch) return exactMatch;

  const groupLower = groupName.toLowerCase();
  for (const [key, value] of Object.entries(FoodGroupDensities)) {
    if (groupLower.includes(key.toLowerCase()) || key.toLowerCase().includes(groupLower)) {
      return value;
    }
  }

  return DEFAULT_TABLESPOON_WEIGHT;
}

/**
 * Retorna o peso estimado de uma colher de sopa em gramas para uma dada receita.
 * Usa o valor configurado na receita, ou a categoria principal, ou uma média ponderada dos ingredientes.
 */
export function getRecipeTablespoonWeight(recipe: any): number {
  if (recipe?.tablespoonWeightG) return recipe.tablespoonWeightG;
  
  // Tenta pelo ingrediente de maior peso, se disponível
  if (recipe?.ingredients && recipe.ingredients.length > 0) {
    const mainIngredient = [...recipe.ingredients].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0];
    if (mainIngredient.tablespoonWeightG) return mainIngredient.tablespoonWeightG;
    return getTablespoonWeightForGroup(mainIngredient.group || mainIngredient.category);
  }

  // Tenta pelas categorias da receita
  const cats = Array.isArray(recipe?.category) ? recipe.category : [recipe?.category];
  for (const cat of cats) {
    if (cat) {
      const weight = getTablespoonWeightForGroup(cat);
      if (weight !== 15) return weight; // Retorna o primeiro que não seja o padrão, se houver
    }
  }

  return DEFAULT_TABLESPOON_WEIGHT;
}
