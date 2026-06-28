import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, TrendingUp, Users, RefreshCw, Check, ArrowRight, Activity } from "lucide-react";
import { Profile, Recipe, ConsumptionLogDoc } from "../types";
import { consumptionService } from "../services/consumptionService";
import { plannerService } from "../services/plannerService";

interface DashboardProps {
  currentProfile: Profile;
  familyId: string | null;
  activeProfileId: string | null;
  onNavigateToView: (view: any) => void;
}

export default function Dashboard({ currentProfile, familyId, activeProfileId, onNavigateToView }: DashboardProps) {
  const [pendingApproval, setPendingApproval] = useState<string | null>("Elena R.");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [currentProteinPct, setCurrentProteinPct] = useState(0);
  const [currentFiberPct, setCurrentFiberPct] = useState(0);
  const [currentHydrationPct, setCurrentHydrationPct] = useState(0);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!familyId || !activeProfileId) return;
      
      const dateId = consumptionService.formatDateId(new Date());
      const weekId = plannerService.getCurrentWeekId();
      
      try {
        // Load consumption logs for gauges
        const logDoc = await consumptionService.getDayLogs(familyId, activeProfileId, dateId);
        if (logDoc) {
          // Simple estimation based on total calories if macros are not split yet
          const totalKcal = logDoc.totalCalories;
          // Simulation: mapping calories to macro goals (since the form currently only tracks kcal)
          setCurrentProteinPct(Math.min(Math.round((totalKcal / 2450) * 100), 100));
          setCurrentFiberPct(Math.min(Math.round((totalKcal / 2450) * 90), 100));
          setCurrentHydrationPct(Math.min(Math.round((totalKcal / 2450) * 80), 100));
        }
        
        // Load today's plan
        const plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
        if (plan) {
          const currentDayIndex = Math.max(0, new Date().getDay() - 1); // 1 = Monday
          const todayPlan = plan.days[currentDayIndex];
          
          if (todayPlan && todayPlan.recipe) {
            setTodayMeals([{
              id: 'planned-1',
              name: todayPlan.recipe.title,
              description: todayPlan.recipe.description,
              image: todayPlan.recipe.image,
              calories: todayPlan.recipe.nutrition?.calories || 0,
              time: "Almoço",
              completed: false
            }]);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      }
    }
    loadDashboardData();
  }, [familyId, activeProfileId]);

  const toggleMeal = (mealId: string) => {
    setTodayMeals(meals => meals.map(m => m.id === mealId ? { ...m, completed: !m.completed } : m));
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
            className="fixed top-20 right-6 z-50 bg-primary-container text-white px-5 py-3 rounded-lg shadow-lg border border-primary-fixed/20 flex items-center gap-3 font-sans text-sm"
          >
            <Check className="w-4 h-4 text-primary-fixed" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Análise Semanal</h2>
        <p className="font-sans text-sm text-scientific-gray mt-1">
          Acompanhamento dinâmico do metabolismo {currentProfile.name === "Elena Vance" ? "Elena Vance" : currentProfile.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Weekly Gauges and Today's Protocol */}
        <div className="lg:col-span-8 space-y-8">
          {/* Analysis Gauges Card */}
          <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-md font-semibold text-primary">Indicadores de Absorção</h3>
              <span className="flex items-center gap-1.5 text-xs text-secondary bg-sage-wash px-2.5 py-1 rounded font-semibold font-sans uppercase">
                <TrendingUp className="w-3.5 h-3.5" /> TACO 4.0 Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Protein Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <motion.path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - currentProteinPct }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-lg text-primary">
                    {currentProteinPct}%
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Proteína
                </span>
                <span className="font-sans text-xs text-on-surface font-medium">Meta: 120g/dia</span>
              </div>

              {/* Fiber Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <motion.path
                      className="text-gold-leaf"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - currentFiberPct }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-lg text-gold-leaf">
                    {currentFiberPct}%
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Fibras
                </span>
                <span className="font-sans text-xs text-on-surface font-medium">Meta: 30g/dia</span>
              </div>

              {/* Hydration Ring */}
              <div className="bg-white border border-outline-variant/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <motion.path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - currentHydrationPct }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-lg text-secondary">
                    {currentHydrationPct}%
                  </div>
                </div>
                <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest mb-0.5">
                  Hidratação
                </span>
                <span className="font-sans text-xs text-on-surface font-medium">Meta: 2.5L/dia</span>
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
                          meal.completed
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {meal.completed ? "CONCLUÍDO" : "PLANEJADO"}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-scientific-gray line-clamp-1">{meal.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="font-serif text-sm font-semibold text-primary leading-none">
                        {meal.calories} <span className="text-[10px] text-scientific-gray uppercase">kcal</span>
                      </span>
                      <button
                        onClick={() => toggleMeal(meal.id)}
                        className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer"
                        title={meal.completed ? "Desmarcar conclusão" : "Marcar como concluído"}
                      >
                        {meal.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary-container/20 stroke-[2]" />
                        ) : (
                          <Circle className="w-5 h-5 text-outline-variant stroke-[1.5]" />
                        )}
                      </button>
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
  );
}
