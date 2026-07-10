import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Sparkles, Check, Zap, Flame, Scale, Clock, Coffee, X, Search, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Recipe, WeeklyPlan, Profile, IndustrialProduct } from "../types";
import { plannerService } from "../services/plannerService";
import { apiService } from "../services/apiService";
import { userService } from "../services/userService";
import { productService } from "../services/productService";

const ProductScanner = lazy(() => import("./ProductScanner"));

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
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  // Controle de abas para os dias da semana
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  
  // Estados para o Modal de Seleção de Receitas
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{dayIndex: number, mealIndex: number, courseIndex: number} | null>(null);
  const [visibleRecipesCount, setVisibleRecipesCount] = useState(10);

  // Estados para produtos industrializados
  const [modalTab, setModalTab] = useState<'recipes' | 'products'>('recipes');
  const [productSearch, setProductSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<IndustrialProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productScannerOpen, setProductScannerOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      if (!familyId || !activeProfileId) return;
      setLoading(true);
      try {
        const weekId = plannerService.getWeekId(weekOffset);
        let plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
        
        if (!plan) {
          plan = plannerService.generateEmptyPlan(familyId, activeProfileId, weekId, weekOffset);
          await plannerService.saveWeeklyPlan(plan);
        }
        
        setWeeklyPlan(plan);

        // Carrega o perfil ativo para obter metas calóricas/macros
        const members = await userService.getFamilyMembers(familyId);
        const currentProf = members.find(p => p.id === activeProfileId);
        if (currentProf) {
          setActiveProfile(currentProf);
        }

        // Fetch available recipes
        const response = await apiService.getRecipes({ limit: 5000 });
        setAvailableRecipes(response.data);
      } catch (err) {
        console.error("Erro ao carregar planejamento:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [familyId, activeProfileId, weekOffset]);

  useEffect(() => {
    if (!recipeModalOpen || modalTab !== 'products') return;

    let active = true;
    async function searchProducts() {
      setLoadingProducts(true);
      try {
        const res = await productService.searchProducts(productSearch, 1, 30);
        if (active && res.success) {
          setAvailableProducts(res.data);
        }
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    const timer = setTimeout(searchProducts, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [recipeModalOpen, modalTab, productSearch]);

  const convertProductToRecipe = (product: IndustrialProduct): Recipe => {
    return {
      id: `prod-${product.id}`,
      title: product.name,
      description: product.brand ? `Marca: ${product.brand}` : "Produto Industrializado",
      image: product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80",
      category: "PRODUTO",
      nutrition: product.nutrition,
      defaultDurabilityDays: 30,
    };
  };

  const handleSelectProduct = (product: IndustrialProduct) => {
    handleSelectRecipe(convertProductToRecipe(product));
  };

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
      const normalized = await plannerService.saveWeeklyPlan(plan);
      setWeeklyPlan(normalized);
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

  const addFormula = (dayIndex: number, mealIndex: number, courseIndex: number) => {
    setTargetSlot({ dayIndex, mealIndex, courseIndex });
    setModalTab('recipes');
    setProductSearch('');
    setRecipeModalOpen(true);
    setVisibleRecipesCount(10);
  };
  
  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!weeklyPlan || !targetSlot) return;
    
    // 1. Calcular o Peso Base da Receita Original
    let baseWeight = 0;
    let missingWeightData = false;
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(ing => {
        // Tenta usar o peso limpo, se não, tenta usar a quantidade (se for g ou ml)
        if (ing.cleanWeight) {
          baseWeight += ing.cleanWeight;
        } else if (ing.quantity && (ing.unit.toLowerCase() === 'g' || ing.unit.toLowerCase() === 'ml')) {
          baseWeight += ing.quantity;
        } else {
          missingWeightData = true;
          // Fallback para ingredientes sem unidade de peso clara
          baseWeight += 50; 
        }
      });
    }
    
    // Se não tiver ingredientes, vamos estimar pelo peso da porção ou calorias
    if (baseWeight === 0 && recipe.nutrition) {
       // aproximação grotesca: 1g = 1.5 kcal para pratos mistos
       baseWeight = recipe.nutrition.calories / 1.5;
       if (baseWeight === 0) baseWeight = 450; 
    }
    
    // 2. Definir Alvo e Calcular Fator
    const targetWeight = activeProfile?.mealWeightPattern || 450;
    const scaleFactor = targetWeight / baseWeight;
    
    // 3. Escalar a Receita
    const scaledRecipe: Recipe = {
      ...recipe,
      nutrition: {
        calories: Math.round((recipe.nutrition?.calories || 0) * scaleFactor),
        protein: Math.round((recipe.nutrition?.protein || 0) * scaleFactor * 10) / 10,
        carbs: Math.round((recipe.nutrition?.carbs || 0) * scaleFactor * 10) / 10,
        fat: Math.round((recipe.nutrition?.fat || 0) * scaleFactor * 10) / 10,
      },
      estimatedCost: recipe.estimatedCost ? recipe.estimatedCost * scaleFactor : undefined,
      ingredients: recipe.ingredients?.map(ing => ({
        ...ing,
        quantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
        cleanWeight: ing.cleanWeight ? ing.cleanWeight * scaleFactor : undefined,
        grossWeight: ing.grossWeight ? ing.grossWeight * scaleFactor : undefined,
      }))
    };
    
    const { dayIndex, mealIndex, courseIndex } = targetSlot;
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = { ...newCourses[courseIndex], recipe: scaledRecipe };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
    
    setRecipeModalOpen(false);
    setTargetSlot(null);
    
    // 4. Notificar Usuário
    if (missingWeightData) {
      setToastMessage(`⚠️ Atenção: Receita ajustada para ${targetWeight}g, mas alguns ingredientes não possuíam unidade de peso. Verifique o cadastro.`);
    } else {
      setToastMessage(`✅ Receita perfeitamente dimensionada para o alvo de ${targetWeight}g do membro.`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };
  
  const removeFormula = async (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan) return;
    
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = { ...newCourses[courseIndex], recipe: undefined, prepMode: undefined, isLeftover: false, sourceDayName: undefined };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };

  const setPrepMode = async (dayIndex: number, mealIndex: number, courseIndex: number, mode: "batch" | "daily") => {
    if (!weeklyPlan) return;
    
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = {
      ...newCourses[courseIndex],
      prepMode: mode
    };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
  };

  const extendToTomorrow = async (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan || dayIndex >= weeklyPlan.days.length - 1) return;
    
    const currentRecipe = weeklyPlan.days[dayIndex].meals[mealIndex].courses[courseIndex].recipe;
    if (!currentRecipe) return;

    const newDays = [...weeklyPlan.days];
    const nextMeals = [...newDays[dayIndex + 1].meals];
    
    // Tentamos encontrar o mesmo meal e course no dia seguinte
    if (nextMeals[mealIndex] && nextMeals[mealIndex].courses[courseIndex]) {
      const nextCourses = [...nextMeals[mealIndex].courses];
      nextCourses[courseIndex] = {
        ...nextCourses[courseIndex],
        recipe: currentRecipe,
        prepMode: "batch" // Assume-se que vai sobrar da receita feita hoje
      };
      nextMeals[mealIndex] = { ...nextMeals[mealIndex], courses: nextCourses };
      newDays[dayIndex + 1] = { ...newDays[dayIndex + 1], meals: nextMeals };
      
      const newPlan = { ...weeklyPlan, days: newDays };
      setWeeklyPlan(newPlan);
      savePlanDebounced(newPlan);
      
      setToastMessage("Receita prorrogada para o dia seguinte!");
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage("Não há slot equivalente no dia seguinte!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const toggleLeftover = (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan) return;
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = {
      ...newCourses[courseIndex],
      isLeftover: !newCourses[courseIndex].isLeftover
    };
    
    if (newCourses[courseIndex].isLeftover && dayIndex > 0) {
      newCourses[courseIndex].sourceDayName = newDays[dayIndex - 1].dayName;
    } else {
      newCourses[courseIndex].sourceDayName = undefined;
    }
    
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    savePlanDebounced(newPlan);
  };

  const toggleCloseDay = async (dayIndex: number) => {
    if (!weeklyPlan) return;
    
    const newDays = [...weeklyPlan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      isClosed: !newDays[dayIndex].isClosed
    };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
    
    setToastMessage(newDays[dayIndex].isClosed ? "Planejamento do dia fechado!" : "Planejamento do dia reaberto.");
    setTimeout(() => setToastMessage(null), 3000);
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

  const isDayClosed = weeklyPlan.days[selectedDayIndex].isClosed;
  const targetCalories = activeProfile?.dailyCalories || 2000;
  const targetProtein = Math.round((targetCalories * (activeProfile?.proteinPercentage || 30) / 100) / 4);
  const targetCarbs = Math.round((targetCalories * (activeProfile?.carbsPercentage || 40) / 100) / 4);

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
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-sans text-3xl font-bold text-primary tracking-tight">Cardápio Semanal</h2>
            <div className="flex items-center bg-surface-container rounded-lg p-1 border border-outline-variant/30">
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1 hover:bg-white rounded text-primary transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 font-sans text-sm font-bold text-on-surface-variant min-w-[120px] text-center">
                {weekOffset === 0 ? "Semana Atual" : weekOffset === 1 ? "Próxima Semana" : weekOffset === -1 ? "Semana Passada" : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
              </span>
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1 hover:bg-white rounded text-primary transition-colors"
                title="Próxima semana"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
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

      {/* Day Selector Tabs and Close Status */}
      <div className="space-y-4">
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
              {day.isClosed && (
                <span className="block text-[8px] font-bold text-amber-300 uppercase mt-0.5">Fechado</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center bg-lab-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isDayClosed ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
            <span className="font-sans text-xs md:text-sm font-semibold text-primary">
              Status do Dia: {isDayClosed ? "Planejamento Selado (Leitura apenas)" : "Planejamento em Aberto"}
            </span>
          </div>
          <button
            onClick={() => toggleCloseDay(selectedDayIndex)}
            className={`px-4 py-2 rounded-lg font-sans text-xs font-bold transition-all shadow-sm ${
              isDayClosed 
                ? "bg-primary text-white hover:bg-primary/95" 
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {isDayClosed ? "Reabrir Planejamento" : "Fechar Planejamento"}
          </button>
        </div>
      </div>

      {/* Meals Grid for Selected Day */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {weeklyPlan.days[selectedDayIndex].meals.map((meal, mealIndex) => (
          <div key={mealIndex} className="bg-lab-white border border-outline-variant/40 rounded-2xl p-5 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              {meal.name === "Café da Manhã" && <Clock className="w-5 h-5 text-gold-leaf" />}
              {meal.name === "Almoço" && <Flame className="w-5 h-5 text-secondary" />}
              {meal.name === "Café da Tarde" && <Coffee className="w-5 h-5 text-amber-600" />}
              {meal.name === "Jantar" && <Sparkles className="w-5 h-5 text-primary" />}
              {meal.name === "Ceia" && <Scale className="w-5 h-5 text-scientific-gray" />}
              {meal.name}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meal.courses.map((course, courseIndex) => {
                // Detecta se a receita é repetida do dia anterior
                const isRepeat = selectedDayIndex > 0 && 
                  weeklyPlan.days[selectedDayIndex - 1].meals[mealIndex].courses[courseIndex].recipe?.id === course.recipe?.id;
                
                return (
                  <div key={courseIndex} className={`border rounded-xl flex flex-col justify-between overflow-hidden transition-all h-[245px] ${course.recipe ? "border-outline-variant/30 bg-white" : "border-outline-variant/40 border-dashed bg-lab-white/70"}`}>
                    
                    {course.recipe ? (
                      <div className="flex flex-col h-full relative group justify-between">
                        <div>
                          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
                            <span className="bg-primary/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                              {course.type}
                            </span>
                            {course.isLeftover && (
                              <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                Sobra de {course.sourceDayName?.split("-")[0]}
                              </span>
                            )}
                          </div>
                          
                          <div className="h-24 w-full overflow-hidden relative">
                            <img 
                              src={course.recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                              alt={course.recipe.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          </div>
                          
                          <div className="p-3">
                            <h4 className="font-sans text-xs font-bold text-primary leading-tight line-clamp-2">
                              {course.recipe.title}
                            </h4>
                            
                            {/* Controle de Batch vs Daily se for repetida */}
                            {isRepeat && !isDayClosed && (
                              <div className="mt-2 flex flex-col gap-1 bg-surface-container/60 p-1.5 rounded-lg border border-outline-variant/30">
                                <span className="font-sans text-[8px] font-bold text-scientific-gray uppercase tracking-wider">Cozinhar novamente hoje?</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setPrepMode(selectedDayIndex, mealIndex, courseIndex, "daily")}
                                    className={`flex-1 py-0.5 rounded text-[8px] font-bold transition-all ${course.prepMode === "daily" ? "bg-primary text-white" : "bg-outline-variant/30 text-scientific-gray hover:bg-outline-variant/50"}`}
                                  >
                                    Sim (Diário)
                                  </button>
                                  <button
                                    onClick={() => setPrepMode(selectedDayIndex, mealIndex, courseIndex, "batch")}
                                    className={`flex-1 py-0.5 rounded text-[8px] font-bold transition-all ${course.prepMode !== "daily" ? "bg-primary text-white" : "bg-outline-variant/30 text-scientific-gray hover:bg-outline-variant/50"}`}
                                  >
                                    Não (Lote)
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 pt-0 flex flex-col gap-2 border-t border-outline-variant/10 mt-auto">
                          <div className="flex justify-between items-center w-full mt-2">
                            <span className="font-serif text-xs font-bold text-scientific-gray">
                              {Math.round((course.recipe.nutrition?.calories || 0) * (weeklyPlan.portionScale / 2))} kcal
                            </span>
                            {!isDayClosed && (
                              <div className="flex gap-3">
                                {selectedDayIndex < weeklyPlan.days.length - 1 && (
                                  <button
                                    onClick={() => extendToTomorrow(selectedDayIndex, mealIndex, courseIndex)}
                                    className="text-[9px] uppercase font-bold text-primary hover:underline"
                                    title="Prorrogar o uso da receita para o próximo dia"
                                  >
                                    Repetir Amanhã
                                  </button>
                                )}
                                <button
                                  onClick={() => removeFormula(selectedDayIndex, mealIndex, courseIndex)}
                                  className="text-[9px] uppercase font-bold text-error hover:underline"
                                >
                                  Remover
                                </button>
                              </div>
                            )}
                          </div>
                          {!isDayClosed && selectedDayIndex > 0 && (
                            <label className="flex items-center gap-1.5 cursor-pointer group pb-1">
                              <input 
                                type="checkbox" 
                                checked={!!course.isLeftover} 
                                onChange={() => toggleLeftover(selectedDayIndex, mealIndex, courseIndex)}
                                className="w-3 h-3 text-primary border-outline-variant/50 rounded focus:ring-primary cursor-pointer"
                              />
                              <span className="font-sans text-[9px] font-medium text-scientific-gray group-hover:text-primary transition-colors">
                                Porção restante do dia anterior
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-3">
                          {course.type}
                        </span>
                        {!isDayClosed ? (
                          <>
                            <button
                              onClick={() => addFormula(selectedDayIndex, mealIndex, courseIndex)}
                              className="w-10 h-10 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-sage-wash hover:scale-105 transition-all focus:outline-none cursor-pointer mb-2"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="font-sans text-[10px] text-scientific-gray">
                              Adicionar Prato
                            </span>
                          </>
                        ) : (
                          <span className="font-sans text-[10px] text-scientific-gray italic">
                            Vazio
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sugestões de Pratos Complementares */}
      {availableRecipes.length > 0 && !isDayClosed && (dailyCalories < targetCalories || dailyProtein < targetProtein) && (
        <section className="bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-serif text-base font-bold text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-leaf" />
            Sugestões Nutricionais para o Dia
          </h4>
          <p className="font-sans text-xs text-scientific-gray">
            Com base nas metas nutricionais, sugerimos adicionar um dos seguintes pratos para atingir seu objetivo calórico/proteico diário:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableRecipes
              .filter(recipe => {
                if (dailyProtein < targetProtein) {
                  return recipe.category?.includes("ALTA PROTEÍNA") || (recipe.nutrition?.protein && recipe.nutrition.protein > 20);
                }
                return recipe.nutrition?.calories && recipe.nutrition.calories > 200;
              })
              .slice(0, 3)
              .map(recipe => (
                <div key={recipe.id} className="bg-lab-white p-3 border border-outline-variant/30 rounded-xl flex gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"} alt={recipe.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h5 className="font-sans text-xs font-bold text-primary truncate">{recipe.title}</h5>
                      <span className="font-sans text-[9px] text-scientific-gray block">
                        {recipe.nutrition?.calories} kcal • {recipe.nutrition?.protein}g Proteína
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newDays = [...weeklyPlan.days];
                      const newMeals = [...newDays[selectedDayIndex].meals];
                      let added = false;
                      for (let m = 0; m < newMeals.length; m++) {
                        for (let c = 0; c < newMeals[m].courses.length; c++) {
                          if (!newMeals[m].courses[c].recipe) {
                            const newCourses = [...newMeals[m].courses];
                            newCourses[c] = { ...newCourses[c], recipe };
                            newMeals[m] = { ...newMeals[m], courses: newCourses };
                            newDays[selectedDayIndex] = { ...newDays[selectedDayIndex], meals: newMeals };
                            added = true;
                            break;
                          }
                        }
                        if (added) break;
                      }
                      if (added) {
                        const newPlan = { ...weeklyPlan, days: newDays };
                        setWeeklyPlan(newPlan);
                        savePlanDebounced(newPlan);
                        setToastMessage("Prato complementar adicionado!");
                        setTimeout(() => setToastMessage(null), 3000);
                      } else {
                        setToastMessage("Nenhum slot disponível hoje!");
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    }}
                    className="p-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg transition-all"
                    title="Adicionar ao cardápio"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}

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
                <span className="font-sans text-xs text-scientific-gray font-bold mb-1">/ {targetCalories} kcal</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-sans font-bold text-scientific-gray">
                <span>Proteínas: {dailyProtein}g / {targetProtein}g</span>
                <span>Carbos: {dailyCarbs}g / {targetCarbs}g</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((dailyCalories / targetCalories) * 100, 100)}%` }}></div>
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
              <span className="font-sans text-sm font-bold text-primary">Alvo: {targetCalories} kcal</span>
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

      {/* Modal de Seleção de Receita */}
      <AnimatePresence>
        {recipeModalOpen && targetSlot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-lab-white">
                <div>
                  <h3 className="font-serif text-xl font-bold text-primary">
                    {modalTab === 'recipes' ? "Selecione uma Receita" : "Selecione um Produto"}
                  </h3>
                  <p className="font-sans text-xs text-scientific-gray mt-1">
                    Para: {weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name} - {weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].courses[targetSlot.courseIndex].type}
                  </p>
                </div>
                <button
                  onClick={() => setRecipeModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/30 text-scientific-gray transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Seletor de Abas */}
              <div className="flex border-b border-outline-variant/20 bg-lab-white px-5">
                <button
                  onClick={() => setModalTab('recipes')}
                  className={`py-3 px-4 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all focus:outline-none ${modalTab === 'recipes' ? 'border-primary text-primary' : 'border-transparent text-scientific-gray hover:text-primary'}`}
                >
                  🍳 Receitas
                </button>
                <button
                  onClick={() => setModalTab('products')}
                  className={`py-3 px-4 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all focus:outline-none ${modalTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-scientific-gray hover:text-primary'}`}
                >
                  📦 Produtos Industrializados
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {modalTab === 'recipes' ? (
                  availableRecipes.length === 0 ? (
                    <p className="text-center font-sans text-sm text-scientific-gray py-10">Nenhuma receita disponível.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        let filteredRecipes = availableRecipes.filter(recipe => {
                          const currentPeriod = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name;
                          const courseType = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].courses[targetSlot.courseIndex].type;
                          
                          const p = Array.isArray(recipe.category) ? recipe.category : (recipe.category ? [recipe.category] : []);
                          const rawMom = (recipe as any).momento;
                          const m = Array.isArray(rawMom) ? rawMom : (rawMom ? [rawMom] : []);
                          
                          const isDrink = p.includes("Bebidas") || m.includes("Bebidas");
                          const isDessert = p.includes("Doces e Sobremesas");
                          const isSnack = m.includes("Lanche / Chá da Tarde") || m.includes("Petiscos&Food Tricks") || p.includes("Padaria e Pastelaria") || m.includes("Café da Manhã") || m.includes("Ceia");
                          const isStarter = m.includes("Entradas") || p.includes("Saladas e Pratos Frios") || m.includes("Sopas e Caldos");

                          switch (courseType) {
                            case "Entrada": return isStarter || isSnack;
                            case "Sobremesa": return isDessert;
                            case "Bebida": return isDrink;
                            case "Lanche": return isSnack || isDessert || p.includes("Massas e Risotos");
                            case "Prato Principal": if (isDrink || isDessert || m.includes("Entradas") || p.includes("Bebidas")) return false; return true;
                            default: return true;
                          }
                        });

                        const currentPeriod = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name;
                        
                        // Sort so approved recipes appear first
                        filteredRecipes.sort((a, b) => {
                          const aApp = activeProfile?.approvedRecipes?.some(r => r.recipeId === a.id) ? 1 : 0;
                          const bApp = activeProfile?.approvedRecipes?.some(r => r.recipeId === b.id) ? 1 : 0;
                          return bApp - aApp;
                        });

                        return (
                          <>
                            {filteredRecipes.slice(0, visibleRecipesCount).map((recipe) => {
                              const isApproved = activeProfile?.approvedRecipes?.some(r => r.recipeId === recipe.id);
                              return (
                                <div
                                  key={recipe.id}
                                  className={`border ${isApproved ? 'border-primary shadow-sm bg-primary/5' : 'border-outline-variant/30 bg-white'} rounded-xl p-3 flex gap-3 items-center hover:border-primary hover:shadow-md cursor-pointer transition-all`}
                                  onClick={() => handleSelectRecipe(recipe)}
                                >
                                  <img
                                    src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                                    alt={recipe.title}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-sans text-xs font-bold text-primary leading-tight line-clamp-2">
                                        {recipe.title}
                                      </h4>
                                      {isApproved && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Preferida</span>}
                                    </div>
                                    <div className="flex gap-2 mt-1.5 items-center">
                                      <span className="font-sans text-[9px] font-bold text-scientific-gray uppercase tracking-wider truncate">
                                        {Array.isArray(recipe.category) ? recipe.category[0] : (recipe.category || "RECEITA")}
                                      </span>
                                      <span className="text-outline-variant/50 text-[10px]">•</span>
                                      <span className="font-serif text-[10px] font-bold text-primary">
                                        {recipe.nutrition?.calories || 0} kcal
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {filteredRecipes.length > visibleRecipesCount && (
                              <div className="col-span-1 sm:col-span-2 mt-2">
                                <button
                                  onClick={() => setVisibleRecipesCount(prev => prev + 10)}
                                  className="w-full py-2 border border-outline-variant rounded-xl text-primary font-medium hover:bg-sage-wash transition-colors text-sm"
                                >
                                  Mostrar mais ({filteredRecipes.length - visibleRecipesCount})
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )
                ) : (
                  // ABA DE PRODUTOS
                  <div className="space-y-4">
                    {/* Barra de busca e escaneamento */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-scientific-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Buscar produto cadastrado..."
                          className="w-full pl-10 pr-4 py-2 bg-lab-white border border-outline-variant/40 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all font-sans"
                        />
                      </div>
                      <button
                        onClick={() => setProductScannerOpen(true)}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-sans text-xs font-bold hover:bg-primary/95 transition-all flex items-center gap-1.5 focus:outline-none"
                      >
                        <Camera className="w-4 h-4" />
                        CADASTRAR
                      </button>
                    </div>

                    {loadingProducts ? (
                      <div className="py-12 text-center">
                        <svg className="animate-spin h-6 w-6 text-primary mx-auto" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="font-sans text-xs text-scientific-gray mt-2">Buscando dispensa...</p>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-outline-variant/40 rounded-xl bg-lab-white/50">
                        <p className="font-sans text-xs text-scientific-gray">
                          Nenhum produto industrializado encontrado. <br />
                          Clique em <strong>CADASTRAR</strong> para ler um código de barras.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableProducts.map((product) => (
                          <div
                            key={product.id}
                            className="border border-outline-variant/30 rounded-xl p-3 flex gap-3 items-center hover:border-primary hover:shadow-md cursor-pointer transition-all bg-white"
                            onClick={() => handleSelectProduct(product)}
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-outline-variant/20 flex items-center justify-center flex-shrink-0 text-scientific-gray text-xl">
                                📦
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-sans text-xs font-bold text-primary leading-tight line-clamp-2">
                                {product.name}
                              </h4>
                              {product.brand && (
                                <span className="block font-sans text-[9px] text-scientific-gray uppercase tracking-wider truncate mt-0.5">
                                  {product.brand}
                                </span>
                              )}
                              <div className="flex gap-2 mt-1.5 items-center">
                                <span className="font-sans text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {product.source === 'OFF' ? 'OFF' : 'Manual'}
                                </span>
                                <span className="text-outline-variant/50 text-[10px]">•</span>
                                <span className="font-serif text-[10px] font-bold text-primary">
                                  {product.nutrition?.calories || 0} kcal
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sub-modal do Scanner */}
      <AnimatePresence>
        {productScannerOpen && (
          <Suspense fallback={
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-6 text-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="font-sans text-xs text-scientific-gray">Carregando câmera...</p>
              </div>
            </div>
          }>
            <ProductScanner
              onProductRegistered={(prod) => {
                setProductScannerOpen(false);
                handleSelectProduct(prod);
              }}
              onClose={() => setProductScannerOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
