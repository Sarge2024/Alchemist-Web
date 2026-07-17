/**
 * Definições de unidades culinárias e SI para ingredientes.
 * Usado na Ficha Técnica e na conversão para a Lista de Compras.
 */

export interface UnitDefinition {
  value: string;        // Abreviação armazenada (ex: "g", "ml", "xíc")
  label: string;        // Nome para exibição (ex: "Gramas (g)", "Xícara (chá)")
  type: 'si' | 'culinaria';
  siUnit?: string;      // Unidade SI equivalente (ex: "g", "ml", "kg", "l")
  siConversionFactor?: number; // Fator de conversão para SI (ex: xícara → 240 ml)
}

// Categorias de unidades
export const UNIT_GROUPS = {
  massa: 'Massa / Peso',
  volume: 'Volume / Líquidos',
  unidade: 'Unidades / Contagem',
} as const;

export const UNITS: UnitDefinition[] = [
  // ─── SI — Massa ───────────────────────────────────────────
  { value: 'g',   label: 'Gramas (g)',        type: 'si' },
  { value: 'kg',  label: 'Quilogramas (kg)',   type: 'si' },

  // ─── SI — Volume ──────────────────────────────────────────
  { value: 'ml',  label: 'Mililitros (ml)',    type: 'si' },
  { value: 'l',   label: 'Litros (l)',         type: 'si' },

  // ─── Unidades / Contagem ──────────────────────────────────
  { value: 'unid',  label: 'Unidade(s)',       type: 'si' },
  { value: 'dente', label: 'Dente(s)',         type: 'culinaria', siUnit: 'g',  siConversionFactor: 5 },
  { value: 'fatia', label: 'Fatia(s)',         type: 'culinaria', siUnit: 'g',  siConversionFactor: 25 },
  { value: 'folha', label: 'Folha(s)',         type: 'culinaria', siUnit: 'g',  siConversionFactor: 3 },
  { value: 'maço',  label: 'Maço(s)',          type: 'culinaria', siUnit: 'g',  siConversionFactor: 100 },
  { value: 'ramo',  label: 'Ramo(s)',          type: 'culinaria', siUnit: 'g',  siConversionFactor: 10 },
  { value: 'pitada', label: 'Pitada(s)',       type: 'culinaria', siUnit: 'g',  siConversionFactor: 0.5 },
  { value: 'lata',  label: 'Lata(s)',          type: 'culinaria', siUnit: 'ml', siConversionFactor: 350 },
  { value: 'pacote', label: 'Pacote(s)',       type: 'culinaria', siUnit: 'g',  siConversionFactor: 500 },

  // ─── Culinárias — Volume ──────────────────────────────────
  { value: 'xíc',   label: 'Xícara (chá)',     type: 'culinaria', siUnit: 'ml', siConversionFactor: 240 },
  { value: 'cs',    label: 'Colher de sopa',   type: 'culinaria', siUnit: 'ml', siConversionFactor: 15 },
  { value: 'csob',  label: 'Colher de sobremesa', type: 'culinaria', siUnit: 'ml', siConversionFactor: 10 },
  { value: 'cch',   label: 'Colher de chá',    type: 'culinaria', siUnit: 'ml', siConversionFactor: 5 },
  { value: 'ccf',   label: 'Colher de café',   type: 'culinaria', siUnit: 'ml', siConversionFactor: 2.5 },
  { value: 'copo',  label: 'Copo (200ml)',      type: 'culinaria', siUnit: 'ml', siConversionFactor: 200 },
];

/**
 * Encontra a definição de uma unidade pelo seu value ou por nome parcial.
 */
export function findUnit(unitStr: string): UnitDefinition | undefined {
  if (!unitStr) return undefined;
  const normalized = unitStr.trim().toLowerCase();

  // Busca exata por value
  const exact = UNITS.find(u => u.value.toLowerCase() === normalized);
  if (exact) return exact;

  // Busca por aliases comuns (strings que vêm do banco)
  const aliasMap: Record<string, string> = {
    'grama': 'g', 'gramas': 'g',
    'quilo': 'kg', 'quilograma': 'kg', 'quilogramas': 'kg',
    'mililitro': 'ml', 'mililitros': 'ml',
    'litro': 'l', 'litros': 'l',
    'unidade': 'unid', 'unidades': 'unid', 'un': 'unid', 'u': 'unid',
    'dentes': 'dente',
    'fatias': 'fatia',
    'folhas': 'folha',
    'maços': 'maço',
    'ramos': 'ramo',
    'pitadas': 'pitada',
    'latas': 'lata',
    'pacotes': 'pacote',
    'xícara': 'xíc', 'xicara': 'xíc', 'xícaras': 'xíc', 'xicaras': 'xíc',
    'colher de sopa': 'cs', 'colher sopa': 'cs',
    'colher de sobremesa': 'csob', 'colher sobremesa': 'csob',
    'colher de chá': 'cch', 'colher chá': 'cch', 'colher cha': 'cch',
    'colher de café': 'ccf', 'colher café': 'ccf', 'colher cafe': 'ccf',
    'copo': 'copo', 'copos': 'copo',
  };

  const aliasKey = aliasMap[normalized];
  if (aliasKey) {
    return UNITS.find(u => u.value === aliasKey);
  }

  // Busca parcial (substring match no label)
  return UNITS.find(u => u.label.toLowerCase().includes(normalized) || normalized.includes(u.value.toLowerCase()));
}

/**
 * Retorna o label legível de uma unidade a partir de sua abreviação.
 */
export function getUnitLabel(unitStr: string): string {
  const def = findUnit(unitStr);
  return def ? def.label : unitStr;
}

export interface SIConversionResult {
  value: number;   // Valor convertido em SI
  unit: string;    // Unidade SI ("g", "ml", "kg", "l", "unid")
}

/**
 * Converte um valor + unidade culinária para unidade SI (g/ml/kg/l).
 * Arredonda para cima (Math.ceil) se precisão < 2 casas decimais.
 * Para unidades já SI, converte g→kg e ml→l quando valor >= 1000.
 */
export function convertToSI(quantity: number, unitStr: string): SIConversionResult {
  const def = findUnit(unitStr);

  let siValue: number;
  let siUnit: string;

  if (!def) {
    // Unidade desconhecida, retorna como está
    return { value: quantity, unit: unitStr };
  }

  if (def.type === 'culinaria' && def.siConversionFactor && def.siUnit) {
    // Converte culinária → SI base (g ou ml)
    siValue = quantity * def.siConversionFactor;
    siUnit = def.siUnit;
  } else {
    // Já é SI
    siValue = quantity;
    siUnit = def.value;
  }

  // Converte g → kg quando >= 1000
  if (siUnit === 'g' && siValue >= 1000) {
    siValue = siValue / 1000;
    siUnit = 'kg';
  }
  // Converte ml → l quando >= 1000
  if (siUnit === 'ml' && siValue >= 1000) {
    siValue = siValue / 1000;
    siUnit = 'l';
  }

  // Arredonda para cima com 2 casas decimais
  siValue = Math.ceil(siValue * 100) / 100;

  return { value: siValue, unit: siUnit };
}
