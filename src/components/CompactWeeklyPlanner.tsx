import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Changed to framer-motion matching typical Vite setup
import { Plus, X, Search, Clock, Flame, Coffee, Sparkles, ChevronLeft, ChevronRight, Sunrise, Sun, Moon, Camera } from "lucide-react";
import { Recipe, WeeklyPlan, Profile, IndustrialProduct } from "../types";
import { plannerService } from "../services/plannerService";
import { apiService } from "../services/apiService";
import { userService } from "../services/userService";
import { productService } from "../services/productService";

const ProductScanner = lazy(() => import("./ProductScanner"));

const isAlcoholicRecipe = (recipe: Recipe): boolean => {
  const title = recipe.title.toLowerCase();
  const description = (recipe.description || '').toLowerCase();
  
  const alcoholTerms = [
    'alcoólico', 'alcoólica', 'alcoolico', 'alcoolica', 'alcohol', 'beer', 'cerveja', 
    'vinho', 'wine', 'gin', 'vodka', 'whisky', 'whiskey', 'rum', 'cachaça', 
    'caipirinha', 'mimosa', 'margarita', 'mojito', 'coquetel', 'cocktail', 
    'chopp', 'champagne', 'champanhe', 'prosecco', 'licor', 'sake', 'saquê',
    'tequila', 'brandy', 'conhaque', 'campari', 'martini', 'aperol'
  ];
  
  const matchesText = alcoholTerms.some(t => title.includes(t) || description.includes(t));
  
  let matchesIngredient = false;
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    matchesIngredient = recipe.ingredients.some(ing => {
      const ingName = (typeof ing === 'string' ? ing : ing.name || '').toLowerCase();
      return ['cachaça', 'vodka', 'rum', 'gin', 'whisky', 'whiskey', 'vinho', 'cerveja', 'licor', 'tequila', 'champagne', 'champanhe', 'sake', 'saquê', 'prosecco', 'conhaque', 'brandy', 'campari', 'martini', 'aperol', 'álcool'].some(alc => ingName.includes(alc));
    });
  }
  
  return matchesText || matchesIngredient;
};

interface CompactWeeklyPlannerProps {
  key?: string;
  familyId: string | null;
  activeProfileId: string | null;
}

export default function CompactWeeklyPlanner({ familyId, activeProfileId }: CompactWeeklyPlannerProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  // Navigation
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Modal states
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{dayIndex: number, mealIndex: number, courseIndex: number} | null>(null);
  const [visibleRecipesCount, setVisibleRecipesCount] = useState(10);
  const [modalTab, setModalTab] = useState<'recipes' | 'products'>('recipes');

  // Products state for Modal
  const [productSearch, setProductSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<IndustrialProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productScannerOpen, setProductScannerOpen] = useState(false);

  // Popover state for the `+` button
  const [activePopoverDayIndex, setActivePopoverDayIndex] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopoverDayIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      if (!familyId || !activeProfileId) {
        setWeeklyPlan(null);
        setActiveProfile(null);
        setAvailableRecipes([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setWeeklyPlan(null);
      setActiveProfile(null);
      
      try {
        const weekId = plannerService.getWeekId(weekOffset);
        let plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
        
        if (!plan) {
          plan = plannerService.generateEmptyPlan(familyId, activeProfileId, weekId, weekOffset);
          await plannerService.saveWeeklyPlan(plan);
        }
        
        setWeeklyPlan(plan);

        const members = await userService.getFamilyMembers(familyId);
        const currentProf = members.find(p => p.id === activeProfileId);
        if (currentProf) {
          setActiveProfile(currentProf);
        }

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

  // Product Search
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

  const savePlanDebounced = async (plan: WeeklyPlan) => {
    try {
      const normalized = await plannerService.saveWeeklyPlan(plan);
      setWeeklyPlan(normalized);
    } catch (e) {
      console.error(e);
    }
  };

  const openRecipeModalForMeal = (dayIndex: number, mealName: string) => {
    if (!weeklyPlan) return;
    
    // Find the meal index
    const meals = weeklyPlan.days[dayIndex].meals;
    const mealIndex = meals.findIndex(m => m.name === mealName);
    
    if (mealIndex !== -1) {
      // Find the first empty course, or just default to course 0
      let courseIndex = 0;
      const courses = meals[mealIndex].courses;
      for (let i = 0; i < courses.length; i++) {
        if (!courses[i].recipe) {
          courseIndex = i;
          break;
        }
      }
      
      setTargetSlot({ dayIndex, mealIndex, courseIndex });
      setModalTab('recipes');
      setProductSearch('');
      setRecipeModalOpen(true);
      setVisibleRecipesCount(10);
      setActivePopoverDayIndex(null); // Close the popover
    }
  };
  
  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!weeklyPlan || !targetSlot) return;
    
    const { dayIndex, mealIndex, courseIndex } = targetSlot;
    const newDays = [...weeklyPlan.days];
    const newMeals = [...newDays[dayIndex].meals];
    const newCourses = [...newMeals[mealIndex].courses];
    
    newCourses[courseIndex] = { ...newCourses[courseIndex], recipe };
    newMeals[mealIndex] = { ...newMeals[mealIndex], courses: newCourses };
    newDays[dayIndex] = { ...newDays[dayIndex], meals: newMeals };
    
    const newPlan = { ...weeklyPlan, days: newDays };
    setWeeklyPlan(newPlan);
    await savePlanDebounced(newPlan);
    
    setRecipeModalOpen(false);
    setTargetSlot(null);
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

  const toggleLeftover = (dayIndex: number, mealIndex: number, courseIndex: number) => {
    if (!weeklyPlan || !familyId || !activeProfileId) return;
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

  const getWeekRangeStr = () => {
    if (!weeklyPlan || weeklyPlan.days.length === 0) return "";
    const format = (dateStr: string) => {
      // Input is typically "6 de jul." or similar depending on the date string from plannerService
      return dateStr;
    };
    return `${format(weeklyPlan.days[0].dateStr)} - ${format(weeklyPlan.days[weeklyPlan.days.length-1].dateStr)}`;
  };

  if (loading || !weeklyPlan) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Map to get standard icons for meals
  const mealIcons: Record<string, React.ReactNode> = {
    "Café da Manhã": <Sunrise className="w-4 h-4 text-scientific-gray" />,
    "Almoço": <Sun className="w-4 h-4 text-scientific-gray" />,
    "Jantar": <Moon className="w-4 h-4 text-scientific-gray" />,
    "Café da Tarde": <Coffee className="w-4 h-4 text-scientific-gray" />,
    "Ceia": <Coffee className="w-4 h-4 text-scientific-gray" />
  };

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded shadow text-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header compact view */}
      <div className="px-4 md:px-6 py-4 border-b border-outline-variant/30 sticky top-0 bg-white z-40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 max-w-7xl mx-auto">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
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
        </div>
      </div>

      {/* Days List */}
      <div className="flex flex-col max-w-md mx-auto pt-4 px-2">
        {weeklyPlan.days.map((day, dayIndex) => {
          // Check if day is today
          const isToday = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) === day.dateStr;
          
          // Get flat list of recipes for this day
          const dayRecipes: {mealName: string, recipe: Recipe, courseIndex: number, mealIndex: number, isLeftover?: boolean}[] = [];
          day.meals.forEach((meal, mealIndex) => {
            meal.courses.forEach((course, courseIndex) => {
              if (course.recipe) {
                dayRecipes.push({
                  mealName: meal.name,
                  recipe: course.recipe,
                  courseIndex,
                  mealIndex,
                  isLeftover: course.isLeftover
                });
              }
            });
          });

          return (
            <div key={dayIndex} className="border-b border-outline-variant/20 relative">
              {/* Day Header */}
              <div className="px-4 py-4 flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`font-semibold text-base ${isToday ? 'text-blue-600' : 'text-on-surface'}`}>
                    {isToday && "Hoje • "}{day.dayName.split('-')[0]} {day.dateStr.split(' ')[0]}
                  </h3>
                  
                  {/* Recipes List or Empty state */}
                  <div className="mt-2 space-y-3">
                    {dayRecipes.length === 0 ? (
                      <p className="text-sm text-scientific-gray">Nenhuma receita ainda</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {dayRecipes.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 bg-lab-white p-2 rounded-lg relative pr-8">
                            <div className="flex items-center gap-3">
                              <img src={item.recipe.image} alt={item.recipe.title} className="w-10 h-10 rounded-md object-cover" />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] text-scientific-gray uppercase tracking-wider block">{item.mealName}</span>
                                <p className="text-sm font-semibold text-primary truncate">{item.recipe.title}</p>
                              </div>
                            </div>
                            
                            {dayIndex > 0 && (
                              <label className="flex items-center gap-1.5 cursor-pointer group mt-1">
                                <input 
                                  type="checkbox" 
                                  checked={!!item.isLeftover} 
                                  onChange={() => toggleLeftover(dayIndex, item.mealIndex, item.courseIndex)}
                                  className="w-3 h-3 text-primary border-outline-variant/50 rounded focus:ring-primary cursor-pointer"
                                />
                                <span className="font-sans text-[9px] font-medium text-scientific-gray group-hover:text-primary transition-colors">
                                  Porção restante do dia anterior
                                </span>
                              </label>
                            )}

                            <button 
                              onClick={() => removeFormula(dayIndex, item.mealIndex, item.courseIndex)}
                              className="absolute right-2 top-2 p-1 text-error opacity-50 hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add button & Popover */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopoverDayIndex(activePopoverDayIndex === dayIndex ? null : dayIndex);
                    }}
                    className="p-2 text-scientific-gray hover:text-primary transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Popover Menu */}
                  <AnimatePresence>
                    {activePopoverDayIndex === dayIndex && (
                      <motion.div 
                        ref={popoverRef}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-outline-variant/20 w-48 z-50 overflow-hidden"
                      >
                        <div className="flex flex-col">
                          {["Café da Manhã", "Almoço", "Café da Tarde", "Jantar", "Ceia"].map((mealName) => (
                            <button 
                              key={mealName}
                              onClick={() => openRecipeModalForMeal(dayIndex, mealName)}
                              className="flex items-center justify-between px-4 py-3 hover:bg-lab-white transition-colors border-b border-outline-variant/10 last:border-b-0 text-sm font-medium text-on-surface"
                            >
                              <span>{mealName === "Café da Tarde" ? "Lanche da Tarde" : mealName}</span>
                              {mealIcons[mealName]}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE RECEITAS */}
      <AnimatePresence>
        {recipeModalOpen && targetSlot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-lab-white">
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary">
                    {modalTab === 'recipes' ? "Selecionar Receita" : "Selecionar Produto"}
                  </h3>
                  <p className="font-sans text-xs text-scientific-gray mt-0.5">
                    Para: {weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name}
                  </p>
                </div>
                <button
                  onClick={() => setRecipeModalOpen(false)}
                  className="p-2 rounded-full hover:bg-outline-variant/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Seletor de Abas */}
              <div className="flex border-b border-outline-variant/20 bg-lab-white px-2">
                <button
                  onClick={() => setModalTab('recipes')}
                  className={`py-2 px-3 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all flex-1 text-center ${modalTab === 'recipes' ? 'border-primary text-primary' : 'border-transparent text-scientific-gray hover:text-primary'}`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setModalTab('products')}
                  className={`py-2 px-3 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all flex-1 text-center ${modalTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-scientific-gray hover:text-primary'}`}
                >
                  Produtos
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {modalTab === 'recipes' ? (
                  availableRecipes.length === 0 ? (
                    <p className="text-center text-sm text-scientific-gray py-10">Nenhuma receita disponível.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(() => {
                        let filteredRecipes = availableRecipes.filter(recipe => {
                          if (!targetSlot || !weeklyPlan) return true;
                          const courseType = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].courses[targetSlot.courseIndex].type;
                          
                          const currentPeriod = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name;
                          
                          const p = Array.isArray(recipe.category) ? recipe.category : (recipe.category ? [recipe.category] : []);
                          const rawMom = (recipe as any).momento;
                          const m = Array.isArray(rawMom) ? rawMom : (rawMom ? [rawMom] : []);
                          
                          const normalizedPeriods = currentPeriod === "Café da Tarde" 
                            ? ["Café da Tarde", "Lanche / Chá da Tarde", "Lanche"] 
                            : [currentPeriod];
                          const isExactMealMatch = m.some(val => normalizedPeriods.includes(val));
                          
                          const isDrink = p.includes("Bebidas") || m.includes("Bebidas");
                          
                          // Evitar bebidas alcoólicas no Café da Manhã, Café da Tarde e Ceia
                          const isNonAlcoholicPeriod = ["Café da Manhã", "Café da Tarde", "Ceia"].includes(currentPeriod);
                          if (isNonAlcoholicPeriod && isAlcoholicRecipe(recipe)) {
                            return false;
                          }

                          const isDessert = p.includes("Doces e Sobremesas") || m.includes("Sobremesas");
                          const isSnack = m.includes("Lanche / Chá da Tarde") || m.includes("Petiscos&Food Tricks") || p.includes("Padaria e Pastelaria") || m.includes("Café da Manhã") || m.includes("Ceia");
                          const isStarter = m.includes("Entradas") || p.includes("Saladas e Pratos Frios") || m.includes("Sopas e Caldos");

                          switch (courseType) {
                            case "Entrada": 
                              return isStarter || (isSnack && !isDessert && !isDrink) || (isExactMealMatch && !isDrink && !isDessert);
                            case "Sobremesa": 
                              return isDessert;
                            case "Bebida": 
                              return isDrink && isExactMealMatch;
                            case "Lanche": 
                              return isSnack || isDessert || p.includes("Massas e Risotos") || isExactMealMatch;
                            case "Prato Principal": 
                              if (isDrink || isDessert || isStarter || isSnack) {
                                if (isExactMealMatch && !isDrink && !isDessert) return true;
                                return false;
                              }
                              return true;
                            default: return true;
                          }
                        });

                        
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
                                  className={`border ${isApproved ? 'border-primary shadow-sm bg-primary/5' : 'border-outline-variant/30 bg-white'} rounded-xl p-2 flex gap-3 items-center hover:border-primary active:bg-sage-wash cursor-pointer transition-all`}
                                  onClick={() => handleSelectRecipe(recipe)}
                                >
                                  <img
                                    src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                                    alt={recipe.title}
                                    className="w-14 h-14 rounded-lg object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-semibold text-primary truncate">
                                        {recipe.title}
                                      </h4>
                                      {isApproved && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Preferida</span>}
                                    </div>
                                    <span className="font-sans text-[10px] text-scientific-gray uppercase flex gap-2 flex-wrap mt-0.5">
                                      <span>🔥 {recipe.nutrition?.calories || 0} kcal</span>
                                      <span>• 🥩 {recipe.nutrition?.protein || 0}g</span>
                                      <span>• 🌾 {recipe.nutrition?.carbs || 0}g</span>
                                      <span>• 🥑 {recipe.nutrition?.fat || 0}g</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {filteredRecipes.length > visibleRecipesCount && (
                              <button
                                onClick={() => setVisibleRecipesCount(prev => prev + 10)}
                                className="w-full py-2 border border-outline-variant rounded-xl text-primary font-medium hover:bg-sage-wash transition-colors text-sm mt-2"
                              >
                                Mostrar mais ({filteredRecipes.length - visibleRecipesCount})
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-scientific-gray absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Buscar produto..."
                          className="w-full pl-9 pr-4 py-2 bg-lab-white border border-outline-variant/40 rounded-xl text-sm outline-none focus:border-primary"
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
                      <p className="text-center text-xs text-scientific-gray py-4">Buscando...</p>
                    ) : availableProducts.length === 0 ? (
                      <p className="text-center text-xs text-scientific-gray py-4">Nenhum produto encontrado.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {availableProducts.map(prod => (
                          <div
                            key={prod.id}
                            className="border border-outline-variant/30 rounded-xl p-2 flex gap-3 items-center hover:border-primary cursor-pointer"
                            onClick={() => handleSelectProduct(prod)}
                          >
                            <img src={prod.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"} alt={prod.name} className="w-12 h-12 rounded object-cover" />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-primary truncate">{prod.name}</h4>
                              <span className="text-[10px] text-scientific-gray truncate">{prod.brand}</span>
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
    </div>
  );
}
