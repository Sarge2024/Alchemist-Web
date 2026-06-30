export enum ActiveView {
  DASHBOARD = "dashboard",
  PLANNER = "planner",
  RECIPES = "recipes",
  SHOPPING = "shopping",
  FAMILY = "family",
  HISTORY = "history"
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
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  difficulty?: string;
  prepTime?: string;
  nutrition: RecipeNutrition;
  ingredients?: RecipeIngredient[];
  defaultDurabilityDays?: number;
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
  calories: number;
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
}
