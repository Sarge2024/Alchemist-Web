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
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  category: string; // "CETOGÊNICA", "ALTA PROTEÍNA", "BAIXO CARBO", "SEM AÇÚCAR", "VEGAN"
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  description?: string;
  prepTime?: string;
}

export interface WeeklyPlanDay {
  dayName: string;
  dateStr: string;
  subtitle: string;
  recipe?: Recipe;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: "Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos";
  quantity?: string;
  completed: boolean;
  isManual?: boolean;
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
