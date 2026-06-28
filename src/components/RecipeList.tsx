import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, PlusCircle, Check, Info } from "lucide-react";
import { Recipe } from "../types";
import { apiService } from "../services/apiService";
import RecipeDetail from "./RecipeDetail";

import { plannerService } from "../services/plannerService";
import { shoppingService } from "../services/shoppingService";
import { ShoppingItem } from "../types";

interface RecipeListProps {
  familyId?: string | null;
  activeProfileId?: string | null;
}

export default function RecipeList({ familyId, activeProfileId }: RecipeListProps) {
  const [searchQuery, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [menuRecipes, setMenuRecipes] = useState<Set<string>>(new Set());
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  
  // States para a API
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce do search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const DEFAULT_CATEGORIES = {
    tipo_prato: ["ALTA PROTEÍNA", "BAIXO CARBO", "CAFÉ DA MANHÃ", "CETOGÊNICA", "FITNESS", "FUNCIONAL", "MEDITERRÂNEA"],
    base_alimento: ["Batata Doce", "Frango", "Fruta"],
    momento: ["Almoço", "Café da Manhã", "Jantar", "Lanche", "Pós-Treino"]
  };

  const [apiCategories, setApiCategories] = useState<import("../types").RecipeCategories>(DEFAULT_CATEGORIES);

  // Carregar categorias
  useEffect(() => {
    apiService.getCategories().then((res) => {
      if (res && (res.tipo_prato?.length || res.base_alimento?.length || res.momento?.length)) {
        setApiCategories(res);
      }
    }).catch((err) => {
      console.warn("Usando categorias padrão pois a API falhou:", err.message);
    });
  }, []);

  // Fetch das receitas
  const fetchRecipes = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiService.getRecipes({
        page: isLoadMore ? page + 1 : 1,
        limit: 12,
        search: debouncedSearch,
        category: selectedCategory === "TODAS" ? "" : selectedCategory
      });
      
      if (isLoadMore) {
        setApiRecipes(prev => [...prev, ...response.data]);
        setPage(page + 1);
      } else {
        setApiRecipes(response.data);
        setPage(1);
      }
      
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error("Erro ao carregar receitas:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedCategory, page]);

  useEffect(() => {
    fetchRecipes(false);
  }, [debouncedSearch, selectedCategory]);

  const handleToggleMenu = async (recipeId: string) => {
    // Optimistic UI update
    const isAdding = !menuRecipes.has(recipeId);
    setMenuRecipes((prev) => {
      const newSet = new Set(prev);
      if (isAdding) newSet.add(recipeId);
      else newSet.delete(recipeId);
      return newSet;
    });

    if (!familyId || !activeProfileId) return;

    try {
      const weekId = plannerService.getCurrentWeekId();
      let plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
      if (!plan) {
        plan = plannerService.generateEmptyPlan(familyId, activeProfileId, weekId);
      }

      const recipeObj = apiRecipes.find(r => r.id === recipeId);
      if (!recipeObj) return;

      // Update WeeklyPlan
      let planUpdated = false;
      const newDays = [...plan.days];
      if (isAdding) {
        // Encontrar primeiro slot de "Prato Principal" vazio
        for (let d = 0; d < newDays.length; d++) {
          let added = false;
          for (let m = 0; m < newDays[d].meals.length; m++) {
            for (let c = 0; c < newDays[d].meals[m].courses.length; c++) {
              const course = newDays[d].meals[m].courses[c];
              if (course.type === "Prato Principal" && !course.recipe) {
                newDays[d].meals[m].courses[c] = { ...course, recipe: recipeObj };
                planUpdated = true;
                added = true;
                break;
              }
            }
            if (added) break;
          }
          if (added) break;
        }
      } else {
        // Remover receita do plano
        for (let d = 0; d < newDays.length; d++) {
          for (let m = 0; m < newDays[d].meals.length; m++) {
            for (let c = 0; c < newDays[d].meals[m].courses.length; c++) {
              const course = newDays[d].meals[m].courses[c];
              if (course.recipe?.id === recipeId) {
                newDays[d].meals[m].courses[c] = { ...course, recipe: undefined };
                planUpdated = true;
              }
            }
          }
        }
      }

      if (planUpdated) {
        await plannerService.saveWeeklyPlan({ ...plan, days: newDays });
      }
    } catch (e) {
      console.error("Erro ao integrar com Cardápio/Compras:", e);
      // Revert in case of failure
      setMenuRecipes((prev) => {
        const newSet = new Set(prev);
        if (isAdding) newSet.delete(recipeId);
        else newSet.add(recipeId);
        return newSet;
      });
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchRecipes(true);
    }
  };

  if (selectedRecipeId) {
    return <RecipeDetail recipeId={selectedRecipeId} onBack={() => setSelectedRecipeId(null)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="space-y-8 pb-12"
    >


      {/* Hero Search Section */}
      <section className="space-y-4 max-w-2xl">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Gastronomia Molecular</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">
            Receitas de precisão projetadas para suas necessidades biológicas.
          </p>
        </div>

        {/* Input with Search icon */}
        <div className="relative flex items-center group">
          <Search className="absolute left-4 text-scientific-gray group-focus-within:text-gold-leaf transition-colors w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por ingrediente ou receita..."
            className="w-full pl-11 pr-4 py-3.5 bg-lab-white border border-outline-variant/60 rounded-xl focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf transition-all font-sans text-sm outline-none placeholder:text-outline/70 shadow-sm"
          />
        </div>
      </section>

      {/* Filter Dropdown Container */}
      <section className="pb-1 flex items-center gap-4">
        <label htmlFor="category-select" className="font-sans text-sm font-semibold text-primary">
          Categoria:
        </label>
        <div className="relative">
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-lab-white border border-outline-variant/60 rounded-xl px-4 py-2.5 pr-10 focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf transition-all font-sans text-sm outline-none shadow-sm cursor-pointer min-w-[200px]"
          >
            <option value="TODAS">Todas as Formulações</option>
            
            {apiCategories?.tipo_prato && apiCategories.tipo_prato.length > 0 && (
              <optgroup label="Tipo de Prato">
                {apiCategories.tipo_prato.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            )}
            
            {apiCategories?.momento && apiCategories.momento.length > 0 && (
              <optgroup label="Momento">
                {apiCategories.momento.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            )}
            
            {apiCategories?.base_alimento && apiCategories.base_alimento.length > 0 && (
              <optgroup label="Base Alimentar">
                {apiCategories.base_alimento.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-scientific-gray">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* Simple Recipes List */}
      <section className="flex flex-col gap-3">
        {loading ? (
          /* Skeletons */
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-lab-white border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-5 bg-outline-variant/20 rounded w-full"></div>
                <div className="h-3 bg-outline-variant/20 rounded w-1/3"></div>
              </div>
              <div className="w-5 h-5 bg-outline-variant/20 rounded"></div>
            </div>
          ))
        ) : apiRecipes.length > 0 ? (
          apiRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipeId(recipe.id)}
              className="bg-lab-white border border-outline-variant/30 rounded-xl p-4 flex flex-row items-center justify-between hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col">
                <h3 className="font-serif text-base font-bold text-primary group-hover:text-gold-leaf transition-colors">
                  {recipe.title}
                </h3>
                <div className="flex gap-2 items-center mt-1">
                  <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wide">
                    {Array.isArray(recipe.category) ? recipe.category.join(", ") : recipe.category || "RECEITA"}
                  </span>
                  <span className="text-outline-variant/50">•</span>
                  <span className="font-sans text-xs text-scientific-gray font-semibold">
                    {recipe.nutrition?.calories || 0} kcal
                  </span>
                </div>
              </div>

              {/* Checkbox Action */}
              <div className="flex items-center gap-3 pl-4">
                <label 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`font-sans text-xs font-bold transition-colors select-none hidden sm:block ${menuRecipes.has(recipe.id) ? "text-primary" : "text-scientific-gray"}`}>
                    {menuRecipes.has(recipe.id) ? "NO CARDÁPIO" : "ADICIONAR"}
                  </span>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={menuRecipes.has(recipe.id)}
                      onChange={() => handleToggleMenu(recipe.id)}
                      className="peer appearance-none w-5 h-5 border-2 border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                    />
                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                  </div>
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-lab-white border border-dashed border-outline-variant/50 rounded-xl">
            <Info className="w-6 h-6 text-scientific-gray mx-auto mb-2" />
            <p className="font-sans text-sm text-on-surface-variant font-medium">
              Nenhuma receita molecular encontrada para os termos selecionados.
            </p>
          </div>
        )}
      </section>

      {/* Botão Carregar Mais */}
      {apiRecipes.length > 0 && page < totalPages && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-sage-wash text-primary border border-outline-variant/30 font-sans text-sm font-semibold rounded-full hover:bg-white hover:border-primary/50 transition-all flex items-center justify-center gap-2 min-w-[200px]"
          >
            {loadingMore ? (
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            ) : (
              "Carregar Mais"
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
