export interface ScannedItem {
  name: string;
  searchQuery: string;
  weightGrams: number;
  percentage: number;
  calories: number;
  source: string;
  dbId: string | number | null;
  macronutrients: {
    carbsGrams: number;
    proteinGrams: number;
    fatGrams: number;
  };
}

export interface PlateScannerResponse {
  dishName: string;
  inputTotalWeight: number;
  items: ScannedItem[];
  totalNutrients: {
    calories: number;
    carbohydrates: number;
    protein: number;
    lipids: number;
  };
}

export const analyzePlateImage = async (imageBase64: string, totalWeightGrams: number): Promise<PlateScannerResponse> => {
  const response = await fetch('/api/analyze-plate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      totalWeightGrams,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ao analisar prato: ${response.statusText}`);
  }

  return response.json();
};
