import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Edit, Sparkles, Check, ArrowRight, Zap, HelpCircle } from "lucide-react";
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

  const addFormula = async (dayIndex: number) => {
    if (!weeklyPlan || availableRecipes.length === 0) return;
    const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    
    const newDays = [...weeklyPlan.days];
    newDays[dayIndex] = { ...newDays[dayIndex], recipe: randomRecipe };
    const newPlan = { ...weeklyPlan, days: newDays };
    
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };
  
  const removeFormula = async (dayIndex: number) => {
    if (!weeklyPlan) return;
    const newDays = [...weeklyPlan.days];
    newDays[dayIndex] = { ...newDays[dayIndex], recipe: undefined };
    const newPlan = { ...weeklyPlan, days: newDays };
    
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };

  const [autoAdjusting, setAutoAdjusting] = useState<boolean>(false);

  if (loading || !weeklyPlan) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="space-y-12 pb-12"
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
            Projete sua sequência de ingestão nutricional. Selecione pratos formulados cientificamente para um equilíbrio ideal.
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

      {/* Weekly Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {weeklyPlan.days.map((day, index) => {
          // Special placeholder logic for Tuesday (index 1) just for mockup purposes
          if (index === 1 && !day.recipe) {
            return (
              <div key={index} className="bg-lab-white border border-outline-variant/40 rounded-xl p-5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                        {day.dayName}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-primary">{day.dateStr}</h3>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden mb-4 relative aspect-[4/3] bg-surface-container/30 flex items-center justify-center border border-dashed border-outline-variant/40">
                    <div className="text-center p-4 cursor-pointer hover:opacity-80" onClick={() => addFormula(index)}>
                      <Sparkles className="w-6 h-6 text-scientific-gray/60 mx-auto mb-1.5" />
                      <span className="font-sans text-[10px] text-scientific-gray uppercase tracking-wide">
                        Gerar Formulação
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-scientific-gray italic leading-relaxed mb-4">
                    Pendente de calibração metabólica.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className={`border border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all duration-300 min-h-[300px] ${day.recipe ? "bg-lab-white" : "bg-lab-white/70 border-dashed"}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                      {day.dayName}
                    </span>
                    <h3 className={`font-serif text-xl font-bold ${day.recipe ? "text-primary" : "text-primary/70"}`}>
                      {day.dateStr}
                    </h3>
                  </div>
                  {day.recipe && (
                    <span className="text-[10px] font-sans font-semibold text-secondary uppercase bg-sage-wash px-2 py-0.5 rounded">
                      Ativo
                    </span>
                  )}
                </div>

                {day.recipe ? (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden relative aspect-[4/3] border border-outline-variant/10">
                      <img
                        src={day.recipe.image}
                        alt={day.recipe.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                        <span className="font-sans text-xs font-semibold text-white leading-tight">
                          {day.recipe.title}
                        </span>
                      </div>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded bg-sage-wash text-secondary font-sans text-[10px] font-semibold uppercase">
                      {day.recipe.category}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                    <button
                      onClick={() => addFormula(index)}
                      className="w-10 h-10 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-sage-wash transition-colors focus:outline-none cursor-pointer mb-2"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="font-sans text-[10px] text-scientific-gray font-semibold uppercase tracking-wider">
                      Selecionar Fórmula
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-xs">
                {day.recipe ? (
                  <>
                    <span className="font-serif text-xs font-semibold text-scientific-gray">
                      {Math.round((day.recipe.nutrition?.calories || 0) * (weeklyPlan.portionScale / 2))} kcal
                    </span>
                    <button
                      onClick={() => removeFormula(index)}
                      className="text-[10px] uppercase font-bold text-error hover:underline focus:outline-none"
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <span className="italic text-scientific-gray">Nenhuma fórmula</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lab Insights visualization Section */}
      <section className="bg-white border border-outline-variant/40 rounded-xl p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3 border-l-4 border-l-gold-leaf pl-4">
          <h3 className="font-serif text-lg font-bold text-primary">Insights do Laboratório Nutricional</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Insight 1: Bioavailability */}
          <div className="bg-lab-white p-6 border border-outline-variant/30 rounded-xl flex flex-col justify-between">
            <div>
              <h5 className="font-sans text-[10px] uppercase font-bold text-scientific-gray tracking-wider mb-2">
                Bio-disponibilidade Semanal
              </h5>
              <div className="flex items-end gap-2">
                <span className="font-serif text-3xl font-bold text-primary">92%</span>
                <span className="font-sans text-xs text-secondary font-bold mb-1">+4.2%</span>
              </div>
            </div>
            
            {/* Tiny column chart */}
            <div className="mt-6 h-12 flex items-end gap-1.5">
              <div className="w-2 bg-primary rounded-t" style={{ height: "40%" }}></div>
              <div className="w-2 bg-primary rounded-t" style={{ height: "60%" }}></div>
              <div className="w-2 bg-primary rounded-t" style={{ height: "55%" }}></div>
              <div className="w-2 bg-primary rounded-t" style={{ height: "90%" }}></div>
              <div className="w-2 bg-primary rounded-t" style={{ height: "75%" }}></div>
              <div className="w-2 bg-primary/30 rounded-t" style={{ height: "20%" }}></div>
              <div className="w-2 bg-primary/30 rounded-t" style={{ height: "10%" }}></div>
            </div>
          </div>

          {/* Insight 2: target metabolism */}
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
              <span className="font-sans text-sm font-bold text-primary">2.450 kcal</span>
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
                Recalibrar as próximas porções de jantar para quinta-feira para corresponder à queima metabólica elevada detectada em repouso.
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
