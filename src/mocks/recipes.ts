export const mockRecipes = [
  {
    id: "mock-1",
    title: "Omelete Hipertrófico",
    description: "Omelete rico em proteínas com espinafre e queijo cottage.",
    category: ["Café da Manhã", "ALTA PROTEÍNA"],
    difficulty: "Fácil",
    preparationTime: 15,
    nutrition: { calories: 350, protein: 30, carbs: 5, fat: 22 },
    ingredients: [
      { id: "ing-1", name: "Ovo", amount: 3, unit: "unidade" },
      { id: "ing-2", name: "Espinafre", amount: 50, unit: "g" },
      { id: "ing-3", name: "Queijo Cottage", amount: 30, unit: "g" }
    ],
    preparationSteps: [
      { descricao: "Bata os ovos.", preparo: "Tigela", tempo: 2 },
      { descricao: "Adicione o espinafre e o queijo.", preparo: "Tigela", tempo: 3 },
      { descricao: "Cozinhe em fogo baixo até dourar.", preparo: "Frigideira", tempo: 10 }
    ]
  },
  {
    id: "mock-2",
    title: "Frango Funcional com Batata Doce",
    description: "Clássico maromba otimizado para digestão rápida.",
    category: ["Almoço", "PÓS-TREINO"],
    difficulty: "Médio",
    preparationTime: 30,
    nutrition: { calories: 450, protein: 45, carbs: 50, fat: 8 },
    ingredients: [
      { id: "ing-4", name: "Peito de Frango", amount: 150, unit: "g" },
      { id: "ing-5", name: "Batata Doce", amount: 200, unit: "g" }
    ],
    preparationSteps: [
      { descricao: "Grelhe o frango.", preparo: "Grelha", tempo: 15 },
      { descricao: "Cozinhe a batata doce.", preparo: "Panela", tempo: 15 },
      { descricao: "Sirva.", preparo: "Prato", tempo: 0 }
    ]
  },
  {
    id: "mock-3",
    title: "Salmão Low Carb",
    description: "Salmão assado com crosta de gergelim e aspargos.",
    category: ["Jantar", "BAIXO CARBO"],
    difficulty: "Avançado",
    preparationTime: 40,
    nutrition: { calories: 520, protein: 40, carbs: 10, fat: 35 },
    ingredients: [
      { id: "ing-6", name: "Filé de Salmão", amount: 180, unit: "g" },
      { id: "ing-7", name: "Aspargos", amount: 100, unit: "g" }
    ],
    preparationSteps: [
      { descricao: "Asse o salmão por 20min.", preparo: "Forno", tempo: 20 },
      { descricao: "Grelhe os aspargos.", preparo: "Grelha", tempo: 10 },
      { descricao: "Sirva.", preparo: "Prato", tempo: 0 }
    ]
  }
];
