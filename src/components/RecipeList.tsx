import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, PlusCircle, Check, Info } from "lucide-react";
import { preloadedRecipes } from "../data/recipes";
import { Recipe } from "../types";

export default function RecipeList() {
  const [searchQuery, setSearchInput] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [addedRecipeId, setAddedRecipeId] = useState<string | null>(null);

  const categories = ["TODAS", "ALTA PROTEÍNA", "CETOGÊNICA", "BAIXO CARBO", "VEGAN", "SEM AÇÚCAR"];

  const handleAddRecipe = (recipeId: string) => {
    setAddedRecipeId(recipeId);
    setTimeout(() => {
      setAddedRecipeId(null);
    }, 3000);
  };

  const filteredRecipes = preloadedRecipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "TODAS" || recipe.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
        {addedRecipeId && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-24 md:bottom-10 left-1/2 z-50 bg-primary text-white px-6 py-3.5 rounded-full shadow-2xl border border-primary-fixed/20 flex items-center gap-3 font-sans text-sm"
          >
            <Check className="w-5 h-5 text-primary-fixed stroke-[2.5]" />
            <span>Receita adicionada ao seu cronograma de laboratório!</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            placeholder="Buscar por ingrediente ou meta de macros..."
            className="w-full pl-11 pr-4 py-3.5 bg-lab-white border border-outline-variant/60 rounded-xl focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf transition-all font-sans text-sm outline-none placeholder:text-outline/70 shadow-sm"
          />
        </div>
      </section>

      {/* Filter Chips Container */}
      <section className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-sans text-xs font-semibold whitespace-nowrap active:scale-95 transition-all focus:outline-none border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-sage-wash/60 text-primary border-outline-variant/30 hover:bg-sage-wash"
              }`}
            >
              {cat === "TODAS" ? "Todas as Formulações" : cat}
            </button>
          ))}
          <button className="px-5 py-2 rounded-full bg-sage-wash/60 text-primary border border-outline-variant/30 font-sans text-xs font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Avançados</span>
          </button>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => {
            // Give " नाइट्रोजन " recipe (Nitrogen-Seared Poultry) a double span in large devices just like the mockup!
            const isExtended = recipe.id === "rec-poultry";

            return (
              <article
                key={recipe.id}
                className={`bg-lab-white border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 ${
                  isExtended ? "lg:col-span-2 md:flex-row" : ""
                }`}
              >
                {/* Recipe image with overlay category chip */}
                <div className={`relative overflow-hidden ${isExtended ? "h-64 md:h-full md:w-2/5" : "h-60 w-full"}`}>
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant/20 shadow-sm">
                    <span className="font-sans text-[9px] font-bold text-primary tracking-wide">
                      {recipe.category}
                    </span>
                  </div>
                </div>

                {/* Recipe details */}
                <div className={`p-6 flex-1 flex flex-col justify-between ${isExtended ? "md:p-8" : ""}`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-lg font-bold text-primary leading-tight">
                        {recipe.name}
                      </h3>
                      <span className="font-serif text-xs font-semibold text-gold-leaf whitespace-nowrap ml-2">
                        {recipe.calories} kcal
                      </span>
                    </div>

                    {recipe.description && (
                      <p className="font-sans text-xs text-scientific-gray mb-6 leading-relaxed">
                        {recipe.description}
                      </p>
                    )}

                    {/* Nutrient breakdown table */}
                    <div className="grid grid-cols-3 gap-2 bg-sage-wash/40 p-3.5 rounded border border-outline-variant/10 mb-6">
                      <div className="text-center">
                        <p className="font-sans text-[9px] font-semibold text-scientific-gray uppercase tracking-tighter">
                          PROTEÍNA
                        </p>
                        <p className="font-serif text-base font-bold text-primary">{recipe.protein}g</p>
                      </div>
                      <div className="text-center border-x border-outline-variant/20">
                        <p className="font-sans text-[9px] font-semibold text-scientific-gray uppercase tracking-tighter">
                          CARBOIDRATOS
                        </p>
                        <p className="font-serif text-base font-bold text-primary">{recipe.carbs}g</p>
                      </div>
                      <div className="text-center">
                        <p className="font-sans text-[9px] font-semibold text-scientific-gray uppercase tracking-tighter">
                          GORDURAS
                        </p>
                        <p className="font-serif text-base font-bold text-primary">{recipe.fat}g</p>
                      </div>
                    </div>
                  </div>

                  {/* Add action row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddRecipe(recipe.id)}
                      className={`flex-1 py-3 font-sans text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                        addedRecipeId === recipe.id
                          ? "bg-secondary text-white"
                          : "bg-primary text-white hover:opacity-90 shadow-sm active:scale-[0.98]"
                      }`}
                    >
                      {addedRecipeId === recipe.id ? (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>ADICIONADO</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4.5 h-4.5 text-primary-fixed" />
                          <span>ADICIONAR AO MENU</span>
                        </>
                      )}
                    </button>

                    {isExtended && (
                      <button className="px-4 py-3 border border-primary text-primary font-sans text-xs font-bold rounded-lg hover:bg-sage-wash transition-colors">
                        ESPECIFICAÇÕES
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-lab-white border border-dashed border-outline-variant/50 rounded-xl">
            <Info className="w-8 h-8 text-scientific-gray mx-auto mb-2" />
            <p className="font-sans text-sm text-on-surface-variant font-medium">
              Nenhuma receita molecular encontrada para os termos selecionados.
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                setSelectedCategory("TODAS");
              }}
              className="mt-4 px-5 py-2 bg-primary text-white rounded-lg font-sans text-xs font-semibold hover:opacity-90"
            >
              Ver Todas as Formulações
            </button>
          </div>
        )}
      </section>
    </motion.div>
  );
}
