import { Recipe } from '../types';

/**
 * Tabela de referência de peso por porção (em gramas) baseada em:
 * - TACO 4.0 (Tabela Brasileira de Composição de Alimentos)
 * - Guia Alimentar para a População Brasileira (MS, 2014)
 * - Referências de dimensionamento para adulto mediano
 */

interface PortionCategoryRule {
  keywords: string[];
  weightG: number;
  label: string;
}

const PORTION_RULES: PortionCategoryRule[] = [
  // Sopas e caldos — porção como prato principal (max ~400g)
  { keywords: ['sopa', 'caldo', 'canja', 'consomê', 'minestrone', 'chowder'], weightG: 400, label: 'Sopa (prato)' },

  // Pratos completos montados (prato feito)
  { keywords: ['prato feito', 'pf ', 'executivo', 'marmita', 'quentinha'], weightG: 400, label: 'Prato completo' },

  // Massas e pratos únicos
  { keywords: ['lasanha', 'canelone', 'nhoque', 'escondidinho', 'torta salgada', 'empadão', 'quiche'], weightG: 240, label: 'Prato único' },
  { keywords: ['massa', 'macarrão', 'espaguete', 'fettuccine', 'penne', 'fusilli', 'talharim', 'ravioli'], weightG: 200, label: 'Massa' },

  // Carnes e proteínas
  { keywords: ['peixe', 'salmão', 'tilápia', 'bacalhau', 'atum', 'sardinha', 'camarão', 'posta'], weightG: 75, label: 'Peixe/Fruto do mar' },
  { keywords: ['ovo', 'ovos', 'omelete', 'fritada', 'frittata'], weightG: 90, label: 'Ovos (2 unid)' },
  { keywords: ['frango', 'peito de frango', 'sobrecoxa', 'coxa', 'peru', 'chester'], weightG: 100, label: 'Ave' },
  { keywords: ['carne', 'bife', 'filé', 'costela', 'alcatra', 'picanha', 'maminha', 'cupim', 'hambúrguer', 'almôndega', 'linguiça', 'lombo', 'pernil'], weightG: 100, label: 'Carne' },

  // Saladas
  { keywords: ['salada', 'folhas', 'mix de folhas', 'coleslaw'], weightG: 150, label: 'Salada' },

  // Aperitivos (porção individual)
  { keywords: ['aperitivo', 'petisco', 'porção', 'batata frita', 'mandioca frita', 'polenta frita', 'isca', 'bolinho'], weightG: 150, label: 'Aperitivo' },

  // Acompanhamentos
  { keywords: ['arroz', 'feijão', 'lentilha', 'grão-de-bico', 'purê', 'farofa', 'legume', 'legumes', 'verdura', 'verduras', 'brócolis', 'cenoura'], weightG: 125, label: 'Acompanhamento' },

  // Bebidas (copo padrão ~250ml)
  { keywords: ['suco', 'vitamina', 'smoothie', 'shake', 'batida'], weightG: 250, label: 'Bebida (copo)' },

  // Sobremesas
  { keywords: ['bolo', 'torta doce', 'mousse', 'pudim', 'doce', 'brigadeiro', 'sorvete', 'pavê', 'cheesecake'], weightG: 100, label: 'Sobremesa' },

  // Lanches
  { keywords: ['sanduíche', 'lanche', 'wrap', 'tapioca', 'crepe', 'pão de queijo', 'coxinha', 'empada', 'pastel'], weightG: 180, label: 'Lanche' },

  // Café da manhã
  { keywords: ['cereal', 'granola', 'mingau', 'aveia', 'panqueca', 'waffle'], weightG: 150, label: 'Café da manhã' },
];

/**
 * Retorna o peso padrão (em gramas) de 1 porção de uma receita.
 * 
 * Prioridade:
 * 1. `recipe.portionWeightG` — se definido explicitamente na receita
 * 2. Match por keywords na categoria ou título da receita
 * 3. Default: 350g (refeição completa padrão)
 * 
 * @returns { weightG, label } — peso e rótulo descritivo da porção
 */
export function getDefaultPortionWeight(recipe: Recipe): { weightG: number; label: string } {
  // 1. Campo explícito da receita
  if (recipe.portionWeightG && recipe.portionWeightG > 0) {
    return { weightG: recipe.portionWeightG, label: 'Porção definida' };
  }

  // 2. Match por keywords
  const searchText = [
    recipe.title || '',
    Array.isArray(recipe.category) ? recipe.category.join(' ') : (recipe.category || ''),
    Array.isArray(recipe.momento) ? recipe.momento.join(' ') : (recipe.momento || ''),
  ].join(' ').toLowerCase();

  for (const rule of PORTION_RULES) {
    if (rule.keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
      return { weightG: rule.weightG, label: rule.label };
    }
  }

  // 3. Default: refeição completa (max ~400g)
  return { weightG: 400, label: 'Refeição completa' };
}

/**
 * Converte porções consumidas em um fator decimal para cálculo de macros.
 * 1 porção = fator 1.0 (100% da receita como planejada).
 * 0.5 porção = fator 0.5 (50%).
 * 2 porções = fator 2.0 (200%).
 */
export function portionsToFactor(portions: number): number {
  return Math.max(0, portions);
}

/**
 * Formata a exibição de porções para o usuário.
 * Ex: 0.5 → "½ porção", 1 → "1 porção", 1.5 → "1½ porções", 2 → "2 porções"
 */
export function formatPortions(portions: number): string {
  if (portions === 0) return 'Não consumido';
  if (portions === 0.5) return '½ porção';
  if (portions === 1) return '1 porção';
  if (portions === 1.5) return '1½ porções';
  
  const intPart = Math.floor(portions);
  const fracPart = portions - intPart;
  
  if (fracPart === 0) return `${intPart} porções`;
  if (fracPart === 0.5) return `${intPart}½ porções`;
  return `${portions} porções`;
}
