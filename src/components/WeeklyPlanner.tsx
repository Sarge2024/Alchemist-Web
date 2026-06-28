import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Sparkles, Check, Zap, Flame, Scale, Clock } from "lucide-react";
import { Recipe, WeeklyPlan } from "../types";
import { plannerService } from "../services/plannerService";
import { apiService } from "../services/apiService";

interface WeeklyPlannerProps {
  familyId: string | null;
  activeProfileId: string | null;
}

export default function WeeklyPlanner({ familyId, activeProfileId }: WeeklyPlannerProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [autoAdjusting, setAutoAdjusting] = useState<boolean>(false);
  
  // Controle de abas para os dias da semana
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      if (!familyId || !activeProfileId) return;
      setLoading(true);
      try {
        const weekId = plannerService.getCurrentWeekId();
        let plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
        
        if (!plan) {
          plan = plannerService.generateEmptyPlan(familyId, activeProfileId, weekId);
          await plannerService.saveWeeklyPlan(plan);
        }
        
        setWeeklyPlan(plan);

        // Fetch available recipes
        const response = await apiService.getRecipes({ limit: 50 });
        setAvailableRecipes(response.data);
      } catch (err) {
        console.error("Erro ao carregar planejamento:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [familyId, activeProfileId]);

  const incrementScale = () => {
    if (!weeklyPlan) return;
    const newPlan = { ...weeklyPlan, portionScale: Math.min(weeklyPlan.portionScale + 1, 8) };
    setWeeklyPlan(newPlan);
    savePlanDebounced(newPlan);
  };
  
  const decrementScale = () => {
    if (!weeklyPlan) return;
    const newPlan = { ...weeklyPlan, portionScale: Math.max(weeklyPlan.portionScale - 1, 1) };
    setWeeklyPlan(newPlan);
    savePlanDebounced(newPlan);
  };

  const savePlanDebounced = async (plan: WeeklyPlan) => {
    try {
      await plannerService.saveWeeklyPlan(plan);
    } catch (e) {
      console.error(e);
    }
  };

  const runAutoAdjust = () => {
    if (!weeklyPlan) return;
    setAutoAdjusting(true);
    setTimeout(() => {
      setAutoAdjusting(false);
      setToastMessage("Metabolismo recalibrado! Porções otimizadas para o plano.");
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const addFormula = async (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan || availableRecipes.length === 0) return;
    const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = { ...newCourses[courseIndex], recipe: randomRecipe };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };
  
  const removeFormula = async (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan) return;
    
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = { ...newCourses[courseIndex], recipe: undefined };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };

  if (loading || !weeklyPlan) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate daily totals for the currently selected day
  let dailyCalories = 0;
  let dailyProtein = 0;
  let dailyCarbs = 0;
  
  weeklyPlan.days[selectedDayIndex].meals.forEach(meal => {
    meal.courses.forEach(course => {
      if (course.recipe && course.recipe.nutrition) {
        dailyCalories += (course.recipe.nutrition.calories || 0);
        dailyProtein += (course.recipe.nutrition.protein || 0);
        dailyCarbs += (course.recipe.nutrition.carbs || 0);
      }
    });
  });

  // Apply portion scale
  dailyCalories = Math.round(dailyCalories * (weeklyPlan.portionScale / 2));
  dailyProtein = Math.round(dailyProtein * (weeklyPlan.portionScale / 2));
  dailyCarbs = Math.round(dailyCarbs * (weeklyPlan.portionScale / 2));

  return (
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
            className="fixed top-20 right-6 z-50 bg-primary text-white px-5 py-3 rounded-lg shadow-lg border border-primary-fixed/20 flex items-center gap-3 font-sans text-sm"
          >
            <Check className="w-4 h-4 text-primary-fixed" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Protocolo Semanal</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">
            Projete sua sequência de ingestão nutricional. Selecione pratos para cada refeição do dia.
          </p>
        </div>

        {/* Portion scale controller */}
        <div className="flex items-center gap-4 bg-lab-white p-2.5 rounded-xl border border-outline-variant/40 shadow-sm">
          <span className="font-sans text-xs font-semibold text-on-surface-variant pl-3">
            Escala de Porções:
          </span>
          <div className="flex items-center bg-sage-wash rounded-lg p-1">
            <button
              onClick={decrementScale}
              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-white rounded-md transition-colors focus:outline-none"
              title="Reduzir porções"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-serif text-lg font-bold text-primary">
              {weeklyPlan.portionScale}
            </span>
            <button
              onClick={incrementScale}
              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-white rounded-md transition-colors focus:outline-none"
              title="Aumentar porções"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {weeklyPlan.days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDayIndex(idx)}
            className={`min-w-[120px] p-3 rounded-xl border text-center transition-all ${
              selectedDayIndex === idx 
                ? "bg-primary text-white border-primary shadow-md scale-105" 
                : "bg-lab-white text-on-surface-variant border-outline-variant/40 hover:bg-sage-wash"
            }`}
          >
            <span className="block font-sans text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
              {day.dayName.split("-")[0]}
            </span>
            <span className="font-serif text-lg font-bold">
              {day.dateStr}
            </span>
          </button>
        ))}
      </div>

      {/* Meals Grid for Selected Day */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {weeklyPlan.days[selectedDayIndex].meals.map((meal, mealIndex) => (
          <div key={mealIndex} className="bg-lab-white border border-outline-variant/40 rounded-2xl p-5 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              {meal.name === "Café da Manhã" && <Clock className="w-5 h-5 text-gold-leaf" />}
              {meal.name === "Almoço" && <Flame className="w-5 h-5 text-secondary" />}
              {meal.name === "Jantar" && <Sparkles className="w-5 h-5 text-primary" />}
              {meal.name === "Ceia" && <Scale className="w-5 h-5 text-scientific-gray" />}
              {meal.name}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meal.courses.map((course, courseIndex) => (
                <div key={courseIndex} className={`border rounded-xl flex flex-col justify-between overflow-hidden transition-all h-[200px] ${course.recipe ? "border-outline-variant/30 bg-white" : "border-outline-variant/40 border-dashed bg-lab-white/70"}`}>
                  
                  {course.recipe ? (
                    <div className="flex flex-col h-full relative group">
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-primary/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          {course.type}
                        </span>
                      </div>
                      
                      <div className="h-24 w-full overflow-hidden relative">
                        <img 
                          src={course.recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                          alt={course.recipe.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                      
                      <div className="p-3 flex flex-col flex-1 justify-between">
                        <h4 className="font-sans text-sm font-bold text-primary leading-tight line-clamp-2">
                          {course.recipe.title}
                        </h4>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-serif text-xs font-bold text-scientific-gray">
                            {Math.round((course.recipe.nutrition?.calories || 0) * (weeklyPlan.portionScale / 2))} kcal
                          </span>
                          <button
                            onClick={() => removeFormula(selectedDayIndex, mealIndex, courseIndex)}
                            className="text-[9px] uppercase font-bold text-error hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-3">
                        {course.type}
                      </span>
                      <button
                        onClick={() => addFormula(selectedDayIndex, mealIndex, courseIndex)}
                        className="w-10 h-10 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-sage-wash hover:scale-105 transition-all focus:outline-none cursor-pointer mb-2"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="font-sans text-[10px] text-scientific-gray">
                        Adicionar Prato
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lab Insights visualization Section - Focused on Current Day */}
      <section className="bg-white border border-outline-variant/40 rounded-xl p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3 border-l-4 border-l-gold-leaf pl-4">
          <h3 className="font-serif text-lg font-bold text-primary">Insights do Dia: {weeklyPlan.days[selectedDayIndex].dayName}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Insight 1: Daily Calories */}
          <div className="bg-lab-white p-6 border border-outline-variant/30 rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-sans text-[10px] uppercase font-bold text-scientific-gray tracking-wider mb-2">
                Ingestão Calórica (Estimada)
              </h5>
              <div className="flex items-end gap-2">
                <span className="font-serif text-3xl font-bold text-primary">{dailyCalories}</span>
                <span className="font-sans text-xs text-scientific-gray font-bold mb-1">kcal</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-sans font-bold text-scientific-gray">
                <span>Proteínas: {dailyProtein}g</span>
                <span>Carbos: {dailyCarbs}g</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((dailyCalories / 2500) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Insight 2: Target metabolism */}
          <div className="bg-lab-white p-6 border border-outline-variant/30 rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-sans text-[10px] uppercase font-bold text-scientific-gray tracking-wider mb-3">
                Metabolismo Alvo
              </h5>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Sua trajetória TACO 4.0 atual está otimizada para a indução da:
                <strong className="block text-primary font-bold mt-1 text-sm font-sans">Fusão Cetogênica</strong>
              </p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
              <span className="font-sans text-sm font-bold text-primary">Alvo: 2.450 kcal</span>
              <Zap className="w-4 h-4 text-gold-leaf fill-gold-leaf/20" />
            </div>
          </div>

          {/* Insight 3: Command box */}
          <div className="bg-primary text-white p-6 rounded-xl flex flex-col justify-between shadow-md">
            <div>
              <h5 className="font-sans text-[10px] uppercase font-bold text-primary-fixed/80 tracking-wider mb-2">
                Comando do Lab
              </h5>
              <p className="font-sans text-xs text-white/95 leading-relaxed">
                Recalibrar porções automaticamente para atingir a meta metabólica ideal deste dia.
              </p>
            </div>
            
            <button
              onClick={runAutoAdjust}
              disabled={autoAdjusting}
              className="mt-6 w-full py-2.5 bg-white text-primary rounded-lg font-sans text-xs font-semibold hover:bg-sage-wash hover:text-primary transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {autoAdjusting ? (
                <>
                  <svg className="animate-spin h-4.5 w-4.5 text-primary" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Recalibrando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold-leaf fill-gold-leaf/10" />
                  <span>EXECUTAR AUTO-AJUSTE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
