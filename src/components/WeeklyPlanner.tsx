import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Edit, Sparkles, Check, ArrowRight, Zap, HelpCircle } from "lucide-react";
import { preloadedRecipes } from "../data/recipes";
import { Recipe } from "../types";

export default function WeeklyPlanner() {
  const [portionScale, setPortionScale] = useState<number>(2);
  const [autoAdjusting, setAutoAdjusting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Monday & Wednesday preloaded meals
  const mondayMeal: Recipe = preloadedRecipes[1]; // Bowl de Quinoa Bio-Disponível
  const wednesdayMeal: Recipe = preloadedRecipes[0]; // Formulação de Ômega-3 do Atlântico

  // Custom states for Thursday and Friday meals to allow clicking "+" and selecting/generating formulas
  const [thursdayMeal, setThursdayMeal] = useState<Recipe | null>(null);
  const [fridayMeal, setFridayMeal] = useState<Recipe | null>(null);

  const incrementScale = () => setPortionScale((prev) => Math.min(prev + 1, 8));
  const decrementScale = () => setPortionScale((prev) => Math.max(prev - 1, 1));

  const runAutoAdjust = () => {
    setAutoAdjusting(true);
    setTimeout(() => {
      setAutoAdjusting(false);
      setToastMessage("Metabolismo recalibrado! Porções do cardápio otimizadas para 2.450 kcal.");
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const addFormula = (day: "thu" | "fri") => {
    // Select an unassigned recipe
    const available = preloadedRecipes.filter(
      (r) => r.id !== mondayMeal.id && r.id !== wednesdayMeal.id
    );
    const randomRecipe = available[Math.floor(Math.random() * available.length)];
    
    if (day === "thu") {
      setThursdayMeal(randomRecipe);
    } else {
      setFridayMeal(randomRecipe);
    }
  };

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
              {portionScale}
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
        {/* Day 1: Monday */}
        <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-gold-leaf uppercase tracking-wider block mb-0.5">
                  Segunda-feira
                </span>
                <h3 className="font-serif text-xl font-bold text-primary">24 Out</h3>
              </div>
              <span className="text-[10px] font-sans font-semibold text-secondary uppercase bg-sage-wash px-2 py-0.5 rounded">
                Ativo
              </span>
            </div>

            <div className="rounded-lg overflow-hidden mb-4 relative aspect-[4/3] border border-outline-variant/10">
              <img
                src={mondayMeal.image}
                alt={mondayMeal.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="font-sans text-xs font-semibold text-white leading-tight">
                  {mondayMeal.name}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="px-2 py-0.5 rounded bg-sage-wash text-secondary font-sans text-[10px] font-semibold uppercase">
                {mondayMeal.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-scientific-gray font-sans text-[10px]">
                {mondayMeal.prepTime}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="font-serif text-xs font-semibold text-scientific-gray">
              {Math.round(mondayMeal.calories * (portionScale / 2))} kcal
            </span>
            <span className="font-sans text-[10px] font-semibold text-primary flex items-center gap-1 hover:text-gold-leaf transition-colors cursor-pointer">
              Fórmula <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Day 2: Tuesday (Active placeholder template) */}
        <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                  Terça-feira
                </span>
                <h3 className="font-serif text-xl font-bold text-primary">25 Out</h3>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden mb-4 relative aspect-[4/3] bg-surface-container/30 flex items-center justify-center border border-dashed border-outline-variant/40">
              <div className="text-center p-4">
                <Sparkles className="w-6 h-6 text-scientific-gray/60 mx-auto mb-1.5" />
                <span className="font-sans text-[10px] text-scientific-gray uppercase tracking-wide">
                  Otimização Automática
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-scientific-gray italic leading-relaxed mb-4">
              Gerando sequência de refeições com base nos marcadores do relógio biológico...
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-center">
            <span className="font-sans text-[10px] font-semibold text-scientific-gray uppercase tracking-wider">
              Aguardando Recalibração
            </span>
          </div>
        </div>

        {/* Day 3: Wednesday */}
        <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-5 relative flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                  Quarta-feira
                </span>
                <h3 className="font-serif text-xl font-bold text-primary">26 Out</h3>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden mb-4 relative aspect-[4/3] border border-outline-variant/10">
              <img
                src={wednesdayMeal.image}
                alt={wednesdayMeal.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="font-sans text-xs font-semibold text-white leading-tight">
                  {wednesdayMeal.name}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="px-2 py-0.5 rounded bg-sage-wash text-secondary font-sans text-[10px] font-semibold uppercase">
                {wednesdayMeal.category}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="font-serif text-xs font-semibold text-scientific-gray">
              {Math.round(wednesdayMeal.calories * (portionScale / 2))} kcal
            </span>
            <span className="font-sans text-[10px] font-semibold text-primary flex items-center gap-1 hover:text-gold-leaf transition-colors cursor-pointer">
              Fórmula <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Day 4: Thursday (Interactive Select Formula State) */}
        <div className="bg-lab-white/70 border border-dashed border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between hover:bg-white transition-all duration-300 min-h-[300px]">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                  Quinta-feira
                </span>
                <h3 className="font-serif text-xl font-bold text-primary/70">27 Out</h3>
              </div>
            </div>

            {thursdayMeal ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden relative aspect-[4/3] border border-outline-variant/10">
                  <img
                    src={thursdayMeal.image}
                    alt={thursdayMeal.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="font-sans text-xs font-semibold text-white leading-tight">
                      {thursdayMeal.name}
                    </span>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 rounded bg-sage-wash text-secondary font-sans text-[10px] font-semibold uppercase">
                  {thursdayMeal.category}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <button
                  onClick={() => addFormula("thu")}
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

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-xs text-scientific-gray">
            {thursdayMeal ? (
              <>
                <span>{Math.round(thursdayMeal.calories * (portionScale / 2))} kcal</span>
                <button
                  onClick={() => setThursdayMeal(null)}
                  className="text-[10px] uppercase font-bold text-error hover:underline focus:outline-none"
                >
                  Remover
                </button>
              </>
            ) : (
              <span className="italic">Nenhuma fórmula</span>
            )}
          </div>
        </div>

        {/* Day 5: Friday (Interactive Select Formula State) */}
        <div className="bg-lab-white/70 border border-dashed border-outline-variant/40 rounded-xl p-5 flex flex-col justify-between hover:bg-white transition-all duration-300 min-h-[300px]">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block mb-0.5">
                  Sexta-feira
                </span>
                <h3 className="font-serif text-xl font-bold text-primary/70">28 Out</h3>
              </div>
            </div>

            {fridayMeal ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden relative aspect-[4/3] border border-outline-variant/10">
                  <img
                    src={fridayMeal.image}
                    alt={fridayMeal.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="font-sans text-xs font-semibold text-white leading-tight">
                      {fridayMeal.name}
                    </span>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 rounded bg-sage-wash text-secondary font-sans text-[10px] font-semibold uppercase">
                  {fridayMeal.category}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <button
                  onClick={() => addFormula("fri")}
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

          <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-xs text-scientific-gray">
            {fridayMeal ? (
              <>
                <span>{Math.round(fridayMeal.calories * (portionScale / 2))} kcal</span>
                <button
                  onClick={() => setFridayMeal(null)}
                  className="text-[10px] uppercase font-bold text-error hover:underline focus:outline-none"
                >
                  Remover
                </button>
              </>
            ) : (
              <span className="italic">Nenhuma fórmula</span>
            )}
          </div>
        </div>
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
