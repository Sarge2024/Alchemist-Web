/**
 * Normaliza o nome de um ingrediente removendo descritores de preparação/tamanho,
 * para permitir agrupamento correto na lista de compras.
 * 
 * Ex: "Cebola média picada" → "Cebola"
 *     "Alho, amassado"      → "Alho"
 *     "Tomate em cubos"     → "Tomate"
 */
export function normalizeIngredientName(name: string): string {
  let result = name;
  const termsToRemove = [
    'média', 'médio', 'médias', 'médios',
    'pequena', 'pequeno', 'pequenas', 'pequenos',
    'grande', 'grandes',
    'picada', 'picado', 'picadas', 'picados',
    'ralada', 'ralado', 'raladas', 'ralados',
    'fatiada', 'fatiado', 'fatiadas', 'fatiados',
    'desfiada', 'desfiado', 'desfiadas', 'desfiados',
    'amassada', 'amassado', 'amassadas', 'amassados',
    'cortada', 'cortado', 'cortadas', 'cortados',
    'em cubos', 'em rodelas', 'em tiras', 'em fatias', 'em pedaços',
    'a gosto', 'sem semente', 'sem sementes', 'sem casca', 'com casca',
    'inteira', 'inteiro', 'inteiras', 'inteiros',
    'espremida', 'espremido', 'espremidas', 'espremidos',
    'cozida', 'cozido', 'cozidas', 'cozidos',
    'crua', 'cru', 'cruas', 'crus',
    'assada', 'assado', 'assadas', 'assados',
    'frita', 'frito', 'fritas', 'fritos',
    'moída', 'moído', 'moídas', 'moídos',
    'fresco', 'fresca', 'frescos', 'frescas',
    'maduro', 'madura', 'maduros', 'maduras',
    'bem', 'levemente', 'finamente', 'grosseiramente',
    'batida', 'batido', 'batidas', 'batidos',
    'temperada', 'temperado', 'temperadas', 'temperados',
    'triturada', 'triturado', 'trituradas', 'triturados',
    'seca', 'seco', 'secas', 'secos',
    'congelada', 'congelado', 'congeladas', 'congelados',
    'descascada', 'descascado', 'descascadas', 'descascados',
    'limpa', 'limpo', 'limpas', 'limpos',
    'sem pele', 'sem osso',
  ];

  // Regex matches terms as whole words, surrounded by whitespace/start/end/commas
  const regex = new RegExp(`(^|\\s|,\\s*)(${termsToRemove.join('|')})(?=\\s|$|,)`, 'gi');
  
  let prev;
  do {
    prev = result;
    result = result.replace(regex, '$1').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
  } while (prev !== result);

  // Remove trailing/leading commas
  result = result.replace(/^,+|,+$/g, '').trim();

  // Capitalize first letter, lowercase the rest
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  } else {
    // Fallback to original if normalization emptied the string
    result = name;
  }

  return result;
}
