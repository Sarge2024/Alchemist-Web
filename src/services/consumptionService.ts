import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ConsumptionLogDoc, LogEntry } from '../types';

export const consumptionService = {
  // Format Date to YYYY-MM-DD in local time
  formatDateId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Busca logs de um perfil para uma data específica
  async getDayLogs(familyId: string, profileId: string, dateId: string): Promise<ConsumptionLogDoc | null> {
    if (!db) return null;
    try {
      const logRef = doc(db, `families/${familyId}/consumptionLogs`, `${profileId}_${dateId}`);
      const snap = await getDoc(logRef);
      if (snap.exists()) {
        return snap.data() as ConsumptionLogDoc;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar logs de consumo:", error);
      return null;
    }
  },

  // Salva o documento de log do dia inteiro
  async saveDayLogs(logDoc: ConsumptionLogDoc): Promise<void> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      const logRef = doc(db, `families/${logDoc.familyId}/consumptionLogs`, `${logDoc.profileId}_${logDoc.id}`);
      
      // Recalcula totais antes de salvar
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      let cost = 0;
      
      logDoc.entries.forEach(entry => {
        // Ignora calorias e macros de itens pulados
        if (entry.status !== "SKIPPED") {
          calories += entry.calories || 0;
          protein += entry.protein || 0;
          carbs += entry.carbs || 0;
          fat += entry.fat || 0;
          cost += entry.cost || 0;
        }
      });
      
      const docToSave = {
        ...logDoc,
        totalCalories: calories,
        totalProtein: protein,
        totalCarbs: carbs,
        totalFat: fat,
        totalCost: cost
      };
      
      await setDoc(logRef, docToSave);
    } catch (error) {
      console.error("Erro ao salvar logs de consumo:", error);
      throw error;
    }
  },
  
  // Helper: Gera documento vazio
  generateEmptyLogDoc(familyId: string, profileId: string, dateId: string): ConsumptionLogDoc {
    return {
      id: dateId,
      familyId,
      profileId,
      entries: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalCost: 0
    };
  }
};
