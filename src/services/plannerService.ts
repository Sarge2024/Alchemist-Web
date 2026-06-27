import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { WeeklyPlan, Recipe } from '../types';

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
        return snap.data() as WeeklyPlan;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar plano semanal:", error);
      return null;
    }
  },

  // Cria ou atualiza um plano semanal inteiro
  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      const planRef = doc(db, `families/${plan.familyId}/weeklyPlans`, `${plan.profileId}_${plan.id}`);
      await setDoc(planRef, { ...plan, updatedAt: Date.now() }, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar plano semanal:", error);
      throw error;
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
        subtitle: 'Ativo'
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
