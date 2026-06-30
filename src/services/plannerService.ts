import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { WeeklyPlan, Recipe } from '../types';

import { ShoppingItem, ShoppingListDoc } from '../types';
import { shoppingService } from './shoppingService';

export const plannerService = {
  // Gera um ID de semana baseado na data atual (ex: 2026-W26)
  getCurrentWeekId(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  },

  // Busca o plano semanal de um perfil específico
  async getWeeklyPlan(familyId: string, profileId: string, weekId: string): Promise<WeeklyPlan | null> {
    if (!db) return null;
    try {
      const planRef = doc(db, `families/${familyId}/weeklyPlans`, `${profileId}_${weekId}`);
      const snap = await getDoc(planRef);
      if (snap.exists()) {
        let plan = snap.data() as WeeklyPlan;
        
        // Fallback para planos antigos
        const hasMeals = plan.days.every(d => d.meals && Array.isArray(d.meals));
        if (!hasMeals) {
          console.warn("Plano antigo detectado. Migrando para estrutura de meals...");
          plan.days = plan.days.map(d => ({
            ...d,
            meals: [
              { name: "Café da Manhã", courses: [{ type: "Lanche", recipe: (d as any).recipe }, { type: "Bebida" }] },
              { name: "Almoço", courses: [{ type: "Entrada" }, { type: "Prato Principal" }, { type: "Sobremesa" }, { type: "Bebida" }] },
              { name: "Café da Tarde", courses: [{ type: "Lanche" }, { type: "Bebida" }] },
              { name: "Jantar", courses: [{ type: "Entrada" }, { type: "Prato Principal" }, { type: "Sobremesa" }, { type: "Bebida" }] },
              { name: "Ceia", courses: [{ type: "Lanche" }, { type: "Bebida" }] }
            ]
          }));
        }
        return plan;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar plano semanal:", error);
      return null;
    }
  },

  // Cria ou atualiza um plano semanal inteiro (normalizando sobras e atualizando a lista de compras)
  async saveWeeklyPlan(plan: WeeklyPlan): Promise<WeeklyPlan> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      const normalizedPlan = this.normalizeLeftovers(plan);
      const planRef = doc(db, `families/${normalizedPlan.familyId}/weeklyPlans`, `${normalizedPlan.profileId}_${normalizedPlan.id}`);
      await setDoc(planRef, { ...normalizedPlan, updatedAt: Date.now() }, { merge: true });
      
      // Sincroniza a lista de compras em segundo plano
      await this.syncShoppingList(normalizedPlan.familyId, normalizedPlan);
      
      return normalizedPlan;
    } catch (error) {
      console.error("Erro ao salvar plano semanal:", error);
      throw error;
    }
  },

  // Normaliza as propriedades de sobras dos slots de receita baseando-se na repetição e prepMode
  normalizeLeftovers(plan: WeeklyPlan): WeeklyPlan {
    const newPlan = JSON.parse(JSON.stringify(plan)) as WeeklyPlan;
    
    // Para cada refeição (meal) e cada prato (course)
    for (let m = 0; m < 4; m++) {
      for (let c = 0; c < 4; c++) {
        for (let d = 0; d < newPlan.days.length; d++) {
          const currentCourse = newPlan.days[d].meals[m].courses[c];
          
          if (!currentCourse.recipe) {
            currentCourse.isLeftover = false;
            delete currentCourse.sourceDayName;
            continue;
          }
          
          if (d === 0) {
            currentCourse.isLeftover = false;
            delete currentCourse.sourceDayName;
          } else {
            const prevCourse = newPlan.days[d - 1].meals[m].courses[c];
            const prevRecipe = prevCourse.recipe;
            
            if (prevRecipe && prevRecipe.id === currentCourse.recipe.id && currentCourse.prepMode !== "daily") {
              currentCourse.isLeftover = true;
              
              // Encontra o dia original da preparação no lote (primeiro dia do lote)
              let sourceDayIndex = d - 1;
              while (sourceDayIndex > 0 && newPlan.days[sourceDayIndex].meals[m].courses[c].isLeftover) {
                sourceDayIndex--;
              }
              currentCourse.sourceDayName = newPlan.days[sourceDayIndex].dayName;
            } else {
              currentCourse.isLeftover = false;
              currentCourse.sourceDayName = undefined;
            }
          }
        }
      }
    }
    return newPlan;
  },

  // Sincroniza a lista de compras, gerando ingredientes com base no plano semanal e no prepMode
  async syncShoppingList(familyId: string, plan: WeeklyPlan): Promise<void> {
    try {
      let shoppingListDoc = await shoppingService.getShoppingList(familyId);
      if (!shoppingListDoc) {
        shoppingListDoc = {
          id: "main_list",
          familyId,
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      // Mantém apenas os itens adicionados manualmente
      const manualItems = (shoppingListDoc.items || []).filter(item => item.isManual);

      // Mapa para agrupar ingredientes gerados: chave (nome_unidade) -> dados acumulados
      const generatedMap = new Map<string, { name: string; category: "Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos"; value: number; unit: string }>();

      for (let d = 0; d < plan.days.length; d++) {
        const day = plan.days[d];
        for (let m = 0; m < day.meals.length; m++) {
          const meal = day.meals[m];
          for (let c = 0; c < meal.courses.length; c++) {
            const course = meal.courses[c];
            
            // Só computamos compras se houver receita e NÃO for sobra de outro dia
            if (course.recipe && !course.isLeftover) {
              // Descobre quantos dias essa receita vai cobrir em lote (dias seguidos marcados como sobra)
              let relativeMultiplier = 1;
              let nextD = d + 1;
              while (
                nextD < plan.days.length &&
                plan.days[nextD].meals[m].courses[c].recipe?.id === course.recipe.id &&
                plan.days[nextD].meals[m].courses[c].isLeftover
              ) {
                relativeMultiplier++;
                nextD++;
              }

              // Multiplicador final = dias de consumo (lote) * escala de porções
              const scaleFactor = plan.portionScale / 2;
              const finalMultiplier = relativeMultiplier * scaleFactor;

              const ingredients = course.recipe.ingredients || [];
              for (const ing of ingredients) {
                if (!ing.name) continue;
                const name = ing.name;
                const rawQty = ing.quantity || 0;
                const unit = ing.unit || "";
                
                const normalizedUnit = unit.trim().toLowerCase();
                const key = `${name.toLowerCase().trim()}_${normalizedUnit}`;
                const increment = rawQty * finalMultiplier;

                if (generatedMap.has(key)) {
                  const existing = generatedMap.get(key)!;
                  existing.value += increment;
                } else {
                  const lowerName = name.toLowerCase();
                  let category: "Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos" = "Produtos Genéricos";
                  if (lowerName.includes("ovo") || lowerName.includes("leite") || lowerName.includes("queijo") || lowerName.includes("manteiga")) {
                    category = "Laticínios & Ovos";
                  } else if (
                    lowerName.includes("cenoura") ||
                    lowerName.includes("cebola") ||
                    lowerName.includes("alho") ||
                    lowerName.includes("batata") ||
                    lowerName.includes("fruta") ||
                    lowerName.includes("abacate") ||
                    lowerName.includes("alface") ||
                    lowerName.includes("tomate") ||
                    lowerName.includes("salada")
                  ) {
                    category = "Hortifruti";
                  }

                  generatedMap.set(key, {
                    name,
                    category,
                    value: increment,
                    unit
                  });
                }
              }
            }
          }
        }
      }

      // Converte o mapa consolidado para ShoppingItem[]
      const generatedItems: ShoppingItem[] = Array.from(generatedMap.values()).map((ing, i) => {
        const roundedValue = Math.round(ing.value * 10) / 10;
        return {
          id: `gen_${i}_${Date.now()}`,
          name: ing.name,
          category: ing.category,
          quantity: `${roundedValue} ${ing.unit}`.trim(),
          completed: false,
          isManual: false
        };
      });

      await shoppingService.saveShoppingList({
        ...shoppingListDoc,
        items: [...manualItems, ...generatedItems],
        updatedAt: Date.now()
      });

    } catch (e) {
      console.error("Erro ao sincronizar lista de compras:", e);
    }
  },

  // Helper: Gera um plano semanal vazio para a semana atual
  generateEmptyPlan(familyId: string, profileId: string, weekId: string): WeeklyPlan {
    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    const now = new Date();
    
    const planDays = days.map((dayName, index) => {
      const d = new Date(now);
      // Ajusta para o dia correspondente da semana (Segunda = 1, etc)
      const currentDay = d.getDay();
      const distance = (index + 1) - currentDay;
      d.setDate(d.getDate() + distance);
      
      return {
        dayName,
        dateStr: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        subtitle: 'Ativo',
        meals: [
          {
            name: "Café da Manhã",
            courses: [{ type: "Lanche" }, { type: "Bebida" }]
          },
          {
            name: "Almoço",
            courses: [{ type: "Entrada" }, { type: "Prato Principal" }, { type: "Sobremesa" }, { type: "Bebida" }]
          },
          {
            name: "Café da Tarde",
            courses: [{ type: "Lanche" }, { type: "Bebida" }]
          },
          {
            name: "Jantar",
            courses: [{ type: "Entrada" }, { type: "Prato Principal" }, { type: "Sobremesa" }, { type: "Bebida" }]
          },
          {
            name: "Ceia",
            courses: [{ type: "Lanche" }, { type: "Bebida" }]
          }
        ] as any[]
      };
    });

    return {
      id: weekId,
      familyId,
      profileId,
      days: planDays,
      portionScale: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
};
