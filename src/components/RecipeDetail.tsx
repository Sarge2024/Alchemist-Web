import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Flame, Info, CheckCircle2, ChefHat, Scale } from "lucide-react";
import { apiService } from "../services/apiService";
import { Recipe } from "../types";

interface RecipeDetailProps {
  recipeId: string;
  onBack: () => void;
}

export default function RecipeDetail({ recipeId, onBack }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const response = await apiService.getRecipeById(recipeId);
        setRecipe(response.data);
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-sans text-sm text-scientific-gray">Descodificando formulação...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <p className="text-scientific-gray mb-4">Formulação não encontrada.</p>
        <button onClick={onBack} className="text-primary font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="pb-12 max-w-4xl mx-auto space-y-8"
    >
      {/* Header / Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-scientific-gray hover:text-primary transition-colors font-sans text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Formulações
      </button>

      {/* Hero Section */}
      <div className="bg-lab-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="w-full aspect-[21/9] relative bg-surface-container">
          <img 
            src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80"} 
            alt={recipe.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div>
              <span className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
                {recipe.category || "Receita Molecular"}
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight">
                {recipe.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap border-b border-outline-variant/20 bg-sage-wash/30 divide-x divide-outline-variant/20">
          <div className="flex-1 min-w-[120px] p-4 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-scientific-gray" />
            <span className="font-sans text-sm text-primary font-semibold">{recipe.prepTime || "30 min"}</span>
          </div>
          <div className="flex-1 min-w-[120px] p-4 flex items-center justify-center gap-2">
            <Flame className="w-4 h-4 text-scientific-gray" />
            <span className="font-sans text-sm text-primary font-semibold">{recipe.difficulty || "Média"}</span>
          </div>
          <div className="flex-1 min-w-[120px] p-4 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-scientific-gray" />
            <span className="font-sans text-sm text-primary font-semibold">{recipe.nutrition?.calories || 0} kcal</span>
          </div>
        </div>

        {/* Description & Macros */}
        <div className="p-6 md:p-8 space-y-8">
          {recipe.description && (
            <p className="font-sans text-base text-on-surface-variant leading-relaxed">
              {recipe.description}
            </p>
          )}

          <div className="flex bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm divide-x divide-outline-variant/30">
            <div className="flex-1 p-2 md:p-3 text-center">
              <span className="block font-sans text-[9px] font-bold text-scientific-gray uppercase tracking-widest mb-0.5">Calorias</span>
              <span className="font-serif text-sm md:text-base font-bold text-primary">{recipe.nutrition?.calories || 0}</span>
            </div>
            <div className="flex-1 p-2 md:p-3 text-center">
              <span className="block font-sans text-[9px] font-bold text-scientific-gray uppercase tracking-widest mb-0.5">Proteína</span>
              <span className="font-serif text-sm md:text-base font-bold text-primary">{recipe.nutrition?.protein || 0}g</span>
            </div>
            <div className="flex-1 p-2 md:p-3 text-center">
              <span className="block font-sans text-[9px] font-bold text-scientific-gray uppercase tracking-widest mb-0.5">Carbos</span>
              <span className="font-serif text-sm md:text-base font-bold text-primary">{recipe.nutrition?.carbs || 0}g</span>
            </div>
            <div className="flex-1 p-2 md:p-3 text-center">
              <span className="block font-sans text-[9px] font-bold text-scientific-gray uppercase tracking-widest mb-0.5">Gorduras</span>
              <span className="font-serif text-sm md:text-base font-bold text-gold-leaf">{recipe.nutrition?.fat || 0}g</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ingredients Column */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h3 className="font-serif text-xl font-bold text-primary flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <Scale className="w-5 h-5 text-secondary" />
            Ingredientes
          </h3>
          <ul className="space-y-3">
            {recipe.ingredients?.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-start border-b border-outline-variant/10 pb-2 last:border-0">
                <span className="font-sans text-sm text-on-surface-variant font-medium">{ing.name}</span>
                <span className="font-sans text-sm text-primary font-bold whitespace-nowrap ml-4">
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
            {(!recipe.ingredients || recipe.ingredients.length === 0) && (
              <p className="text-sm text-scientific-gray italic">Nenhum ingrediente catalogado.</p>
            )}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
