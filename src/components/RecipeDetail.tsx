import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Flame, Info, CheckCircle2, ChefHat, Scale, ArrowRightLeft } from "lucide-react";
import { apiService } from "../services/apiService";
import { Recipe, RecipeIngredient } from "../types";
import { getUnitLabel, findUnit, convertToSI, UNITS } from "../utils/unitConversion";

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
            Ingredientes (Ficha Técnica)
          </h3>
          
          <div className="space-y-6">
            {/* Cabeçalho da tabela de ingredientes */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 pb-1 border-b border-outline-variant/30">
              <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider">Ingrediente</span>
              <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider text-right w-16">Valor</span>
              <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider text-center w-36">Unidade</span>
              <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider text-right w-24">Equiv. SI</span>
            </div>

            {Object.entries(
              (recipe.ingredients || []).reduce((acc, ing) => {
                const partName = ing.part || ing.group || "Ingredientes Gerais";
                if (!acc[partName]) acc[partName] = [];
                acc[partName].push(ing);
                return acc;
              }, {} as Record<string, RecipeIngredient[]>)
            ).map(([partGroup, groupIngredients]) => {
              const items = groupIngredients as RecipeIngredient[];
              return (
              <div key={partGroup} className="space-y-3 bg-lab-white/50 p-4 rounded-xl border border-outline-variant/20">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <h4 className="font-sans text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Parte / Grupo: <span className="text-secondary">{partGroup}</span>
                  </h4>
                </div>
                <ul className="space-y-2">
                  {items?.map((ing, idx) => {
                    const unitDef = findUnit(ing.unit || '');
                    const isCulinary = unitDef?.type === 'culinaria';
                    const siResult = isCulinary ? convertToSI(ing.quantity, ing.unit, ing) : null;
                    
                    return (
                    <li key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-outline-variant/10 pb-2 last:border-0">
                      {/* Ingrediente + Categoria */}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-sans text-sm text-on-surface-variant font-medium truncate">{ing.name}</span>
                        {ing.category && (
                          <span className="text-[10px] bg-surface-container text-scientific-gray px-2 py-0.5 rounded font-sans border border-outline-variant/30 flex-shrink-0" title="Área do Supermercado / Grupamento do Estoque">
                            🛒 {ing.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Valor (numérico) */}
                      <span className="font-serif text-sm font-bold text-primary text-right w-16 tabular-nums">
                        {typeof ing.quantity === 'number' ? (Number.isInteger(ing.quantity) ? ing.quantity : ing.quantity.toFixed(2)) : ing.quantity}
                      </span>
                      
                      {/* Unidade (dropdown visual) */}
                      <select
                        value={unitDef?.value || ing.unit || ''}
                        disabled
                        className="w-36 px-2 py-1.5 bg-white border border-outline-variant/40 rounded-lg text-xs font-sans font-semibold text-on-surface-variant appearance-none cursor-default text-center disabled:opacity-80"
                        title={unitDef ? unitDef.label : ing.unit}
                      >
                        {unitDef ? (
                          <option value={unitDef.value}>{unitDef.label}</option>
                        ) : (
                          <option value={ing.unit || ''}>{ing.unit || 'N/A'}</option>
                        )}
                        {UNITS.filter(u => u.value !== unitDef?.value).map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      
                      {/* Equivalência SI */}
                      <div className="w-24 text-right">
                        {siResult ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-md" title="Convertido para Sistema Internacional">
                            <ArrowRightLeft className="w-3 h-3" />
                            {siResult.value} {siResult.unit}
                          </span>
                        ) : (
                          <span className="text-[11px] font-sans text-scientific-gray/50">— SI</span>
                        )}
                      </div>
                    </li>
                  );
                  })}
                </ul>
              </div>
              );
            })}

            {(!recipe.ingredients || recipe.ingredients.length === 0) && (
              <p className="text-sm text-scientific-gray italic">Nenhum ingrediente catalogado.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
