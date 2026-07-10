import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, TrendingUp, Users, RefreshCw, Check, ArrowRight, Activity, X } from "lucide-react";
import { Profile, Recipe, ConsumptionLogDoc } from "../types";
import { consumptionService } from "../services/consumptionService";
import { plannerService } from "../services/plannerService";
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

interface DashboardProps {
  key?: string;
  currentProfile: Profile;
  profiles?: Profile[];
  familyId: string | null;
  activeProfileId: string | null;
  onNavigateToView: (view: any) => void;
  onSelectActiveProfile?: (id: string) => void;
}

export default function Dashboard({ currentProfile, profiles, familyId, activeProfileId, onNavigateToView, onSelectActiveProfile }: DashboardProps) {
  const [pendingApproval, setPendingApproval] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [plannedMacros, setPlannedMacros] = useState({ protein: 0, carbs: 0, fat: 0, kcal: 0 });
  const [actualMacros, setActualMacros] = useState({ protein: 0, carbs: 0, fat: 0, kcal: 0 });
  
  // For Fiber and Hydration (mocks for now as they are not in the profile)
  const [plannedFiber, setPlannedFiber] = useState(0);
  const [actualFiber, setActualFiber] = useState(0);
  
  const [activeProfile, setActiveProfile] = useState<any>(null);
  
  // Partial Consumption (Resto-Ingestão)
  const [partialConsumptionMeal, setPartialConsumptionMeal] = useState<any | null>(null);
  const [consumedPercentage, setConsumedPercentage] = useState<number>(100);
  
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !activeProfileId) {
      setPlannedMacros({ protein: 0, carbs: 0, fat: 0, kcal: 0 });
      setActualMacros({ protein: 0, carbs: 0, fat: 0, kcal: 0 });
      setPlannedFiber(0);
      setActualFiber(0);
      setTodayMeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Use local time for the date string to avoid timezone offset issues (e.g. late night saving as tomorrow)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateId = `${year}-${month}-${day}`;
    
    const weekId = plannerService.getCurrentWeekId();
    
    const d = today.getDay();
    const currentDayIndex = d === 0 ? 6 : d - 1; // 0 is Sunday -> index 6
    
    const planRef = doc(db, `families/${familyId}/weeklyPlans`, `${activeProfileId}_${weekId}`);
    const logRef = doc(db, `families/${familyId}/consumptionLogs`, `${activeProfileId}_${dateId}`);

    let currentPlan: any = null;
    let currentLog: any = null;
    
    const updateDashboard = () => {
      let pMacros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
      let aMacros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
      let pFiber = 0;
      let aFiber = 0;
      let plannedMealsData: any[] = [];
      
      if (currentPlan && currentPlan.days) {
        const todayPlan = currentPlan.days[currentDayIndex];
        if (todayPlan && todayPlan.meals) {
          todayPlan.meals.forEach((meal: any, mIdx: number) => {
            if (!meal.courses) return;
            meal.courses.forEach((course: any, cIdx: number) => {
              if (course.recipe) {
                const rId = `planned-${mIdx}-${cIdx}`;
                const cal = course.recipe.nutrition?.calories || 0;
                const prot = course.recipe.nutrition?.protein || 0;
                const carb = course.recipe.nutrition?.carbs || 0;
                const fat = course.recipe.nutrition?.fat || 0;
                const estCost = course.recipe.estimatedCost || (cal * 0.024); // Fallback mock
                
                pMacros.kcal += cal;
                pMacros.protein += prot;
                pMacros.carbs += carb;
                pMacros.fat += fat;
                pFiber += (carb * 0.1); // mock fiber
                
                let mealStatus = "PENDING";
                if (currentLog && currentLog.entries) {
                  const entry = currentLog.entries.find((e: any) => e.plannedMealRef === rId);
                  if (entry) {
                    mealStatus = entry.status;
                  }
                }
                
                plannedMealsData.push({
                  id: rId,
                  name: course.recipe.title,
                  description: course.recipe.description,
                  image: course.recipe.image,
                  nutrition: {
                    calories: cal,
                    protein: prot,
                    carbs: carb,
                    fat: fat
                  },
                  estimatedCost: estCost,
                  time: meal.name,
                  status: mealStatus
                });
              }
            });
          });
        }
      }
      
      if (currentLog) {
        aMacros.kcal = currentLog.totalCalories || 0;
        aMacros.protein = currentLog.totalProtein || 0;
        aMacros.carbs = currentLog.totalCarbs || 0;
        aMacros.fat = currentLog.totalFat || 0;
        aFiber = (aMacros.carbs * 0.1);
      }
      
      setPlannedMacros(pMacros);
      setActualMacros(aMacros);
      setPlannedFiber(pFiber);
      setActualFiber(aFiber);
      setTodayMeals(plannedMealsData);
      setLoading(false);
    };

    const unsubPlan = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        currentPlan = docSnap.data();
      } else {
        currentPlan = null;
      }
      updateDashboard();
    }, (error) => {
      console.error("Erro ao buscar plano semanal:", error);
      setLoading(false);
    });

    const unsubLog = onSnapshot(logRef, (docSnap) => {
      if (docSnap.exists()) {
        currentLog = docSnap.data();
      } else {
        currentLog = null;
      }
      updateDashboard();
    }, (error) => {
      console.error("Erro ao buscar consumo:", error);
      setLoading(false);
    });

    return () => {
      unsubPlan();
      unsubLog();
    };
  }, [familyId, activeProfileId]);

  const toggleMeal = async (mealId: string, status: "CONSUMED_AS_PLANNED" | "SKIPPED" | "SUBSTITUTED" | "PENDING", pct: number = 100) => {
    // Optimistic UI update
    setTodayMeals(meals => meals.map(m => m.id === mealId ? { ...m, status } : m));
    
    // Save to backend
    if (familyId && activeProfileId) {
      try {
        const dateId = consumptionService.formatDateId(new Date());
        let logDoc = await consumptionService.getDayLogs(familyId, activeProfileId, dateId);
        
        if (!logDoc) {
          logDoc = consumptionService.generateEmptyLogDoc(familyId, activeProfileId, dateId);
        }
        
        const meal = todayMeals.find(m => m.id === mealId);
        if (!meal) return;
        
        // Remove existing entry if any
        logDoc.entries = logDoc.entries.filter(e => e.plannedMealRef !== mealId);
        
        const pctDecimal = pct / 100;
        
        const logEntryCost = meal.estimatedCost ? (meal.estimatedCost * pctDecimal) : 0;
        const wasteCostVal = meal.estimatedCost ? (meal.estimatedCost - logEntryCost) : 0;

        const newEntry: any = {
          id: meal.id,
          time: meal.time,
          foodName: meal.name,
          category: "Planejado",
          calories: Math.round(meal.nutrition.calories * pctDecimal),
          protein: meal.nutrition.protein * pctDecimal,
          carbs: meal.nutrition.carbs * pctDecimal,
          fat: meal.nutrition.fat * pctDecimal,
          cost: logEntryCost,
          consumedPercentage: pct,
          wasteCost: wasteCostVal,
          details: "",
          status: status,
          plannedMealRef: mealId
        };
        
        logDoc.entries.push(newEntry);
        
        await consumptionService.saveDayLogs(logDoc);
        
        // Atualiza macros localmente
        let aMacros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
        logDoc.entries.forEach(e => {
          if (e.status !== "SKIPPED") {
            aMacros.kcal += e.calories;
            aMacros.protein += e.protein;
            aMacros.carbs += e.carbs;
            aMacros.fat += e.fat;
          }
        });
        setActualMacros(aMacros);
        setActualFiber(aMacros.carbs * 0.1);
        
      } catch (err) {
        console.error("Erro ao atualizar status:", err);
      }
    }
  };

  const handleApproval = (action: "approve" | "reject") => {
    if (action === "approve") {
      setToastMessage("Elena R. foi adicionada ao Grupo Familiar com sucesso!");
    } else {
      setToastMessage("Solicitação de Elena R. recusada.");
    }
    setPendingApproval(null);
    setTimeout(() => setToastMessage(null), 4000);
  };
  
  // Calculate goals and percentages
  const goalKcal = currentProfile.dailyCalories || 2000;
  const goalProtein = (goalKcal * (currentProfile.proteinPercentage || 30) / 100) / 4;
  const goalCarbs = (goalKcal * (currentProfile.carbsPercentage || 40) / 100) / 4;
  const goalFat = (goalKcal * (currentProfile.fatPercentage || 30) / 100) / 9;
  const goalFiber = 30; // standard mock

  const getPcts = (actual: number, planned: number, goal: number) => ({
    actual: Math.min(Math.round((actual / goal) * 100), 100) || 0,
    planned: Math.min(Math.round((planned / goal) * 100), 100) || 0,
    actualRaw: Math.round(actual),
    plannedRaw: Math.round(planned),
    goalRaw: Math.round(goal)
  });

  const pcts = {
    protein: getPcts(actualMacros.protein, plannedMacros.protein, goalProtein),
    carbs: getPcts(actualMacros.carbs, plannedMacros.carbs, goalCarbs),
    fat: getPcts(actualMacros.fat, plannedMacros.fat, goalFat),
    fiber: getPcts(actualFiber, plannedFiber, goalFiber)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // CMR Calculations
  const consumedMealsCount = todayMeals.filter(m => m.status === 'CONSUMED_AS_PLANNED' || m.status === 'SUBSTITUTED').length;
  const actualCost = todayMeals.reduce((acc, m) => {
    if (m.status === 'CONSUMED_AS_PLANNED' || m.status === 'SUBSTITUTED') {
      return acc + (m.estimatedCost || 0);
    }
    return acc;
  }, 0);
  const cmr = consumedMealsCount > 0 ? actualCost / consumedMealsCount : 0;
  const isCmrGood = cmr <= 15.0; // Benchmark for good cost

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="space-y-8 pb-12"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-6 z-50 bg-primary-container text-white px-5 py-3 rounded-lg shadow-lg border border-primary-fixed/20 flex items-center gap-3 font-sans text-sm"
          >
            <Check className="w-4 h-4 text-primary-fixed" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title & Navigator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Análise Semanal</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">
            Acompanhamento dinâmico do metabolismo.
          </p>
        </div>
        
        {/* Profile Switcher */}
        {profiles && profiles.length > 0 && onSelectActiveProfile && (
          <div className="flex items-center gap-2 bg-white border border-outline-variant/40 rounded-lg p-1.5 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-scientific-gray pl-2">Membro:</span>
            <div className="flex gap-1">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectActiveProfile(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${p.id === activeProfileId ? 'bg-primary text-white' : 'hover:bg-surface-container text-primary/70'}`}
                >
                  <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Daily Goals Panel */}
          <div className="xl:col-span-2 space-y-6">
          {/* Analysis Gauges Card */}
          <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-md font-semibold text-primary">Indicadores de Absorção</h3>
              <span className="flex items-center gap-1.5 text-xs text-secondary bg-sage-wash px-2.5 py-1 rounded font-semibold font-sans uppercase">
                <TrendingUp className="w-3.5 h-3.5" /> TACO 4.0 Ativo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Protein Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="11.5" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <motion.circle cx="18" cy="18" r="11.5" fill="none" className="text-primary opacity-40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="72.25" initial={{ strokeDashoffset: 72.25 }} animate={{ strokeDashoffset: 72.25 - (pcts.protein.planned * 0.7225) }} transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
                    <motion.circle cx="18" cy="18" r="15.915" fill="none" className="text-primary" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - pcts.protein.actual }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="font-bold text-lg text-primary leading-none">{pcts.protein.actual}%</span>
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Proteína
                </span>
                <span className="font-sans text-[10px] text-on-surface font-medium leading-tight">Meta: {pcts.protein.goalRaw}g</span>
                <span className="font-sans text-[10px] text-scientific-gray leading-tight">Prev: {pcts.protein.plannedRaw}g | Real: {pcts.protein.actualRaw}g</span>
              </div>

              {/* Fiber Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="11.5" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <motion.circle cx="18" cy="18" r="11.5" fill="none" className="text-gold-leaf opacity-40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="72.25" initial={{ strokeDashoffset: 72.25 }} animate={{ strokeDashoffset: 72.25 - (pcts.fiber.planned * 0.7225) }} transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
                    <motion.circle cx="18" cy="18" r="15.915" fill="none" className="text-gold-leaf" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - pcts.fiber.actual }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="font-bold text-lg text-gold-leaf leading-none">{pcts.fiber.actual}%</span>
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Fibras
                </span>
                <span className="font-sans text-[10px] text-on-surface font-medium leading-tight">Meta: {pcts.fiber.goalRaw}g</span>
                <span className="font-sans text-[10px] text-scientific-gray leading-tight">Prev: {pcts.fiber.plannedRaw}g | Real: {pcts.fiber.actualRaw}g</span>
              </div>

              {/* Carbs Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="11.5" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <motion.circle cx="18" cy="18" r="11.5" fill="none" className="text-tertiary opacity-40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="72.25" initial={{ strokeDashoffset: 72.25 }} animate={{ strokeDashoffset: 72.25 - (pcts.carbs.planned * 0.7225) }} transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
                    <motion.circle cx="18" cy="18" r="15.915" fill="none" className="text-tertiary" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - pcts.carbs.actual }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="font-bold text-lg text-tertiary leading-none">{pcts.carbs.actual}%</span>
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Carboidratos
                </span>
                <span className="font-sans text-[10px] text-on-surface font-medium leading-tight">Meta: {pcts.carbs.goalRaw}g</span>
                <span className="font-sans text-[10px] text-scientific-gray leading-tight">Prev: {pcts.carbs.plannedRaw}g | Real: {pcts.carbs.actualRaw}g</span>
              </div>

              {/* Fat Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="11.5" fill="none" className="text-surface-container" stroke="currentColor" strokeWidth="2.5" />
                    <motion.circle cx="18" cy="18" r="11.5" fill="none" className="text-secondary opacity-40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="72.25" initial={{ strokeDashoffset: 72.25 }} animate={{ strokeDashoffset: 72.25 - (pcts.fat.planned * 0.7225) }} transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
                    <motion.circle cx="18" cy="18" r="15.915" fill="none" className="text-secondary" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - pcts.fat.actual }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="font-bold text-lg text-secondary leading-none">{pcts.fat.actual}%</span>
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Gorduras
                </span>
                <span className="font-sans text-[10px] text-on-surface font-medium leading-tight">Meta: {pcts.fat.goalRaw}g</span>
                <span className="font-sans text-[10px] text-scientific-gray leading-tight">Prev: {pcts.fat.plannedRaw}g | Real: {pcts.fat.actualRaw}g</span>
              </div>
            </div>

            {/* Financial Analysis (UAN) */}
            <div className="mt-8">
              <h3 className="font-serif text-lg font-bold text-primary mb-4">Análise de Custos (UAN)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-lab-white border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-center">
                  <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Custo Total do Dia</span>
                  <div className="flex items-end gap-2">
                    <span className="font-serif text-3xl font-bold text-on-surface">
                      R$ {actualCost.toFixed(2)}
                    </span>
                    <span className="font-sans text-xs text-scientific-gray mb-1">estimado</span>
                  </div>
                </div>

                <div className={`border rounded-xl p-5 flex flex-col justify-center transition-colors ${
                  isCmrGood ? 'bg-primary/5 border-primary/20' : 'bg-secondary/5 border-secondary/20'
                }`}>
                  <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">
                    Custo Médio da Refeição (CMR)
                  </span>
                  <div className="flex items-end gap-2">
                    <span className={`font-serif text-3xl font-bold ${isCmrGood ? 'text-primary' : 'text-secondary'}`}>
                      R$ {cmr.toFixed(2)}
                    </span>
                    <span className="font-sans text-xs text-scientific-gray mb-1">/ refeição</span>
                  </div>
                  {!isCmrGood && cmr > 0 && (
                    <span className="font-sans text-[10px] text-secondary mt-1 font-medium">Acima da meta (R$ 15.00)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Protocol */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-primary">Protocolo de Hoje</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {todayMeals.length === 0 ? (
                <div className="text-center py-10 bg-lab-white rounded-xl border border-dashed border-outline-variant/40">
                  <span className="text-scientific-gray font-sans text-sm">Nenhuma formulação planejada para hoje. Vá até o Planejador Semanal.</span>
                </div>
              ) : (
                todayMeals.map((meal) => (
                  <div key={meal.id} className="bg-lab-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-gold-leaf">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider">{meal.time}</span>
                        <h4 className="font-sans text-sm font-semibold text-primary">{meal.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                          meal.status === "CONSUMED_AS_PLANNED" ? "bg-primary text-white" :
                          meal.status === "SKIPPED" ? "bg-error text-white" :
                          meal.status === "SUBSTITUTED" ? "bg-secondary text-white" :
                          "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {meal.status === "PENDING" ? "PLANEJADO" : meal.status}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-scientific-gray line-clamp-1">{meal.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-serif text-sm font-semibold text-primary leading-none">
                        {meal.nutrition.calories} <span className="text-[10px] text-scientific-gray uppercase">kcal</span>
                      </span>
                      
                      <div className="flex gap-1.5 mt-1">
                        <button
                          onClick={() => {
                            if (meal.status === "CONSUMED_AS_PLANNED") {
                              toggleMeal(meal.id, "PENDING");
                            } else {
                              setPartialConsumptionMeal(meal);
                              setConsumedPercentage(100);
                            }
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            meal.status === "CONSUMED_AS_PLANNED" ? "bg-primary text-white" : "bg-white text-primary border border-primary/20 hover:bg-primary/5"
                          }`}
                          title="Confirmar Consumo (Abre Opções)"
                        >
                           <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleMeal(meal.id, meal.status === "SKIPPED" ? "PENDING" : "SKIPPED")}
                          className={`p-1 rounded-md transition-colors ${
                            meal.status === "SKIPPED" ? "bg-error text-white" : "bg-white text-error border border-error/20 hover:bg-error/5"
                          }`}
                          title="Não Consumido (Pulo)"
                        >
                           <Circle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleMeal(meal.id, meal.status === "SUBSTITUTED" ? "PENDING" : "SUBSTITUTED")}
                          className={`p-1 rounded-md transition-colors ${
                            meal.status === "SUBSTITUTED" ? "bg-secondary text-white" : "bg-white text-secondary border border-secondary/20 hover:bg-secondary/5"
                          }`}
                          title="Substituído"
                        >
                           <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Requests & Synchronization status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pending Approvals Widget */}
          <div className="bg-sage-wash/40 border border-outline-variant/40 rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-serif text-md font-bold text-primary mb-1 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-secondary" /> Aprovações Pendentes
              </h3>
              <p className="font-sans text-xs text-scientific-gray mb-4">
                Solicitações de entrada para compartilhamento de dados.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {pendingApproval ? (
                <motion.div
                  key="pending-request"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-4 rounded-lg border border-outline-variant/30 flex flex-col gap-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuACcLGGqMxcGvL0Jz7s8y_GpmYpNHb4AZQK5P8wPVOZWES5hZF3GimqZ72psyQ2GYYB2GGp6wQ2zm7Wm_LMXZfOq-XO8gWf8pNQ-YL04uepejFgxu-EoAZq-lg_DQcBqF_Xm065_CG5j86iKS_nzG67BFxbXHZ-TYVLbdOJzY61sMYQ-T8JxE6g7mPBjEm5otkkYXjCFyOlyhQQbfL1_fnwxu5RIdVQsCMJSFJc33mBPotWis7EHUopg9Grce_0y0ri4fxFWo-tK7ix"
                        alt="Elena R. Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-sans text-xs font-semibold text-primary leading-tight">
                        {pendingApproval}
                      </p>
                      <p className="font-sans text-[10px] text-scientific-gray leading-none mt-0.5">
                        Deseja se juntar ao seu Grupo Familiar
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval("approve")}
                      className="flex-1 bg-primary text-white font-sans text-xs font-semibold py-2 rounded hover:opacity-90 transition-all cursor-pointer"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleApproval("reject")}
                      className="flex-1 border border-primary text-primary hover:bg-sage-wash/50 font-sans text-xs font-semibold py-2 rounded transition-all cursor-pointer"
                    >
                      Recusar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-requests"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/60 p-6 rounded-lg border border-dashed border-outline-variant/50 text-center flex flex-col items-center justify-center py-8"
                >
                  <Check className="w-5 h-5 text-secondary mb-1.5" />
                  <span className="font-sans text-xs text-scientific-gray">
                    Nenhuma aprovação pendente no momento.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cloud Sync Status */}
          <div className="bg-lab-white border border-outline-variant/30 rounded-xl p-5 shadow-sm">
            <h4 className="font-sans text-[10px] uppercase font-bold text-scientific-gray tracking-wider mb-2.5">
              Status do Dispositivo
            </h4>
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-on-surface">Status de Sincronização</span>
              <span className="flex items-center gap-1.5 text-xs text-secondary font-sans font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                Sincronizado
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    
    {/* Partial Consumption Modal */}
    <AnimatePresence>
      {partialConsumptionMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="font-serif text-lg font-bold text-primary">Confirmação de Consumo</h3>
              <button
                onClick={() => setPartialConsumptionMeal(null)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-on-surface/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={partialConsumptionMeal.image} alt="Refeição" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-primary">{partialConsumptionMeal.name}</h4>
                  <p className="font-sans text-[10px] text-scientific-gray uppercase tracking-widest">{partialConsumptionMeal.time}</p>
                </div>
              </div>

              <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
                O quanto você consumiu desta refeição?
              </label>
              <p className="text-xs text-scientific-gray mb-4 font-sans leading-relaxed">
                Deslize para informar o valor exato ingerido. O que sobrar (Resto-Ingestão) será contabilizado no desperdício de caixa (UAN).
              </p>

              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-3xl text-primary">{consumedPercentage}%</span>
                  <span className="font-sans text-xs font-bold text-scientific-gray mt-1">
                    Ingerido: <span className="text-primary">{Math.round((partialConsumptionMeal.nutrition?.calories || 0) * (consumedPercentage / 100))} kcal</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-sans text-xs text-scientific-gray block">
                    Sobrou: <strong className="text-secondary">{100 - consumedPercentage}%</strong> no prato
                  </span>
                  <span className="font-sans text-[10px] text-scientific-gray block mt-1">
                    Desperdício: {Math.round((partialConsumptionMeal.nutrition?.calories || 0) * ((100 - consumedPercentage) / 100))} kcal
                  </span>
                </div>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={consumedPercentage}
                onChange={(e) => setConsumedPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary mb-6"
              />
              
              <div className="flex justify-between gap-2 mb-2">
                <button onClick={() => setConsumedPercentage(25)} className="flex-1 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-sans font-semibold text-scientific-gray hover:bg-surface-container transition-colors">25%</button>
                <button onClick={() => setConsumedPercentage(50)} className="flex-1 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-sans font-semibold text-scientific-gray hover:bg-surface-container transition-colors">50%</button>
                <button onClick={() => setConsumedPercentage(75)} className="flex-1 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-sans font-semibold text-scientific-gray hover:bg-surface-container transition-colors">75%</button>
                <button onClick={() => setConsumedPercentage(100)} className="flex-1 py-1.5 rounded-lg border border-primary/30 text-xs font-sans font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors">100%</button>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-low">
              <button
                onClick={() => setPartialConsumptionMeal(null)}
                className="px-4 py-2 rounded-lg font-sans text-sm font-semibold text-on-surface-variant hover:bg-on-surface/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toggleMeal(partialConsumptionMeal.id, consumedPercentage > 0 ? "CONSUMED_AS_PLANNED" : "SKIPPED", consumedPercentage);
                  setPartialConsumptionMeal(null);
                }}
                className="px-6 py-2 rounded-lg font-sans text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              >
                Salvar Consumo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
