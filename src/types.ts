export enum ActiveView {
  DASHBOARD = "dashboard",
  PLANNER = "planner",
  RECIPES = "recipes",
  SHOPPING = "shopping",
  FAMILY = "family",
  HISTORY = "history",
  SCANNER = "scanner"
}

export enum Role {
  MEMBER = "Membro",
  DEPENDENT = "Dependente",
  CAREGIVER = "Cuidador"
}

export interface Family {
  id: string;
  name: string;
  adminUid: string;
  createdAt: number;
}

export interface Profile {
  id: string;
  familyId?: string;
  name: string;
  avatar: string;
  role: string;
  isMainAccount: boolean;
  relationship?: string; // Grau de parentesco
  phone?: string; // WhatsApp
  dietaryProtocol: string[]; // e.g. ["Vegano", "Sem Lactose"]
  mainMetric: string; // e.g. "120g Meta de Proteína"
  metricValue: number;
  metricLabel: string;
  progressPercentage: number;
  email: string;
  interfaceLanguage: string;
  timezone: string;
  measurementSystem: "metric" | "imperial";
  dailyCalories: number;
  proteinPercentage: number; // e.g. 30
  carbsPercentage: number; // e.g. 45
  fatPercentage: number; // e.g. 25
  allergies: string[]; // e.g. ["Amendoim"]
  medications: string; // text description
  approvedRecipes?: { recipeId: string, period: string }[]; // Preferências de receitas aprovadas por período
  
  // Biometric & Clinical Enrichment
  age?: number;
  gender?: "male" | "female" | "other";
  weight?: number; // kg
  height?: number; // cm
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietGoal?: "weight_loss" | "maintenance" | "muscle_gain";
  mealWeightPattern?: number; // em gramas, ex: 450
  localHabits?: string; // Text field para hábitos locais
  dietaryRestrictions?: string[]; // Seleções múltiplas ex: ["Sem Glúten", "Vegano"]
  allergens?: string; // Campo de texto livre para alergias específicas
  mechanicalCapacity?: "normal" | "dysphagia_mild" | "no_teeth" | "moderate_difficulty";
  intestinalTransit?: "normal" | "constipation" | "diarrhea";
  comorbidities?: string[]; // e.g. ["diabetes", "hypertension", "dyslipidemia", "ckd", "gerd", "copd", "cv_risk", "malnutrition"]
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeIngredient {
  ingredientId?: string;
  name?: string;
  quantity: number;
  unit: string;
  grossWeight?: number;
  cleanWeight?: number;
  cookedWeight?: number;
  correctionFactor?: number;
  cookingFactor?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string | string[];
  momento?: string | string[];
  base_alimento?: string | string[];
  difficulty?: string;
  prepTime?: string;
  nutrition: RecipeNutrition;
  ingredients?: RecipeIngredient[];
  defaultDurabilityDays?: number;
  estimatedCost?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RecipeCategories {
  tipo_prato: string[];
  base_alimento: string[];
  momento: string[];
}

export interface CourseSlot {
  type: "Entrada" | "Prato Principal" | "Sobremesa" | "Bebida" | "Lanche";
  recipe?: Recipe;
  isLeftover?: boolean;
  sourceDayName?: string;
  prepMode?: "batch" | "daily";
  durabilityDays?: number;
}

export interface MealPlan {
  name: "Café da Manhã" | "Almoço" | "Café da Tarde" | "Jantar" | "Ceia";
  courses: CourseSlot[];
}

export interface WeeklyPlanDay {
  dayName: string;
  dateStr: string;
  subtitle: string;
  meals: MealPlan[];
  isClosed?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: "Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos";
  quantity?: string;
  completed: boolean;
  isManual?: boolean;
  recipeId?: string;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  sentDaysAgo: number;
}

export interface LogEntry {
  id: string;
  time: string; // e.g. "08:30"
  foodName: string;
  category: "Planejado" | "Ocasional";
  details: string;
  calories: number; // Calorias consumidas (faturadas)
  protein: number;
  carbs: number;
  fat: number;
  cost?: number; // Custo financeiro consumido
  consumedPercentage?: number; // Porcentagem do que foi efetivamente consumido (0 a 100)
  wasteCost?: number; // Custo financeiro do que sobrou no prato (Resto-Ingestão)
  status: "CONSUMED_AS_PLANNED" | "SKIPPED" | "SUBSTITUTED" | "PENDING";
  plannedMealRef?: string; // Reference to the course/meal in the WeeklyPlan
}

export interface WeeklyPlan {
  id: string; // Ex: "2026-W26"
  familyId: string;
  profileId: string;
  days: WeeklyPlanDay[];
  portionScale: number;
  createdAt: number;
  updatedAt: number;
}

export interface ShoppingListDoc {
  id: string;
  familyId: string;
  items: ShoppingItem[];
  weeklyPlanRef?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConsumptionLogDoc {
  id: string; // Data no formato "YYYY-MM-DD"
  familyId: string;
  profileId: string;
  entries: LogEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalCost?: number; // Custo financeiro total consolidado do dia
}

export interface IndustrialProduct {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  image?: string;
  portionSize: number;       // ex: 200
  portionUnit: string;       // ex: "ml"
  nutrition: RecipeNutrition; // reutiliza o tipo existente
  allergens?: string[];
  source: 'OFF' | 'MANUAL';
  price?: number;
  totalPackageSize?: number;
  totalPackageUnit?: string;
}

export interface RecipeSuggestion {
  id?: string;
  title?: string;
  text?: string;
  url?: string;
  submittedBy: string;
  familyId?: string;
  createdAt: number;
  status: 'pending_review' | 'approved' | 'rejected';
}
