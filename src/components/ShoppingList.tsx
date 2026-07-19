import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { ShoppingItem } from "../types";
import { shoppingService } from "../services/shoppingService";
import { plannerService } from "../services/plannerService";
import { normalizeIngredientName } from "../utils/normalizeIngredient";
import { convertToSI } from "../utils/unitConversion";

interface ShoppingListProps {
  key?: string;
  familyId: string | null;
  activeProfileId: string | null;
}

export default function ShoppingList({ familyId, activeProfileId }: ShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<"Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos">("Produtos Genéricos");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!familyId) {
        setItems([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setItems([]);
      
      try {
        const list = await shoppingService.getShoppingList(familyId);
        setItems(list?.items || []);
      } catch (err) {
        console.error("Erro ao carregar lista de compras:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [familyId]);

  const saveList = async (newItems: ShoppingItem[]) => {
    if (!familyId) return;
    try {
      await shoppingService.saveShoppingList({
        id: "main_list",
        familyId,
        items: newItems,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleItem = (id: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    saveList(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    saveList(newItems);
  };

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      category: newItemCategory,
      quantity: "1 unid",
      completed: false,
      isManual: true
    };
    
    const newItems = [...items, newItem];
    setItems(newItems);
    saveList(newItems);
    setNewItemName("");
    setIsAdding(false);
  };

  const generateFromPlan = async () => {
    if (!familyId || !activeProfileId) {
      setToastMessage("Selecione um perfil primeiro.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    setToastMessage("Sincronizando ingredientes do Cardápio...");
    try {
      const weekId = plannerService.getWeekId(0);
      const plan = await plannerService.getWeeklyPlan(familyId, activeProfileId, weekId);
      
      if (!plan || plan.days.length === 0) {
        setToastMessage("Nenhum cardápio encontrado para esta semana.");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
        // Coletar todos os ingredientes brutos
      const rawIngredients: { name: string; quantity: number; unit: string }[] = [];
      
      const ingredientMap = new Map<string, { name: string, quantity: number, unit: string, category: string }>();

      plan.days.forEach(day => {
        day.meals.forEach(meal => {
          meal.courses.forEach(course => {
            if (course.recipe) {
              if (course.recipe.category === "PRODUTO" || (!course.recipe.ingredients || course.recipe.ingredients.length === 0)) {
                 const nameLower = course.recipe.title.toLowerCase().trim();
                 const key = `${nameLower}_unid`;
                 const current = ingredientMap.get(key);
                 if (current) {
                    current.quantity += 1;
                 } else {
                    ingredientMap.set(key, { name: nameLower, quantity: 1, unit: "unid", category: "Produtos Genéricos" });
                 }
              } else if (course.recipe.ingredients) {
                course.recipe.ingredients.forEach(ing => {
                  const rawName = (ing.name || "").trim();
                  if (!rawName) return;
                  // Normaliza removendo descritores ("média picada", "em cubos", etc.)
                  const nameLower = normalizeIngredientName(rawName).toLowerCase();
                  
                  let numQty = 1;
                  let strUnit = (ing.unit || "").trim() || "unid";
                  
                  if (typeof ing.quantity === 'number') {
                     numQty = ing.quantity;
                  } else if (typeof (ing.quantity as any) === 'string') {
                     const stringQty = ing.quantity as any as string;
                     const qtyMatch = stringQty.match(/([\d.,\s\/]+)\s*(.*)/);
                     if (qtyMatch) {
                         let qStr = qtyMatch[1].trim().replace(',', '.');
                         if (qStr.includes('/')) {
                           const parts = qStr.split('/');
                           if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                             numQty = parseFloat(parts[0]) / parseFloat(parts[1]);
                           }
                         } else {
                           numQty = parseFloat(qStr);
                         }
                         if (isNaN(numQty)) numQty = 1;
                         if (qtyMatch[2].trim()) strUnit = qtyMatch[2].trim();
                     }
                  }
                  
                  // Aplicar escala do plano
                  numQty = numQty * (plan.portionScale / 2);
                  
                  // Aplicar Fator de Correção (Peso Bruto = Peso Limpo x FC)
                  if (ing.correctionFactor && ing.correctionFactor > 1) {
                    numQty = numQty * ing.correctionFactor;
                  }
                  
                  rawIngredients.push({ name: nameLower, quantity: numQty, unit: strUnit });
                });
              }
            }
          });
        });
      });
      
      // Processar ingredientes através do Motor Nutricional para Padronização via DishAlchemists DB
      const NutritionalEngineService = (await import('../services/NutritionalEngineService')).NutritionalEngineService;
      const { details } = await NutritionalEngineService.calculateRecipeNutrition(rawIngredients);
      
      details.forEach(item => {
        // Obter nome e categoria padronizados, com fallback para o original
        let standardizedName = item.base_data?.name ? item.base_data.name.toLowerCase().trim() : item.ingredient;
        
        // Remove vírgulas vindas da padronização TACO (ex: "açúcar, refinado" -> "açúcar refinado")
        standardizedName = standardizedName.replace(/,\s*/g, ' ').trim();
        
        // Normaliza removendo descritores de preparo/tamanho para agrupar corretamente
        standardizedName = normalizeIngredientName(standardizedName).toLowerCase();

        const category = item.base_data?.category || "Produtos Genéricos";
        
        // Converte unidades culinárias para SI usando o utilitário centralizado
        // (arredondamento para cima é feito pelo convertToSI)
        const siResult = convertToSI(item.quantity, item.unit, item.base_data);
        const normQty = siResult.value;
        let normUnit = siResult.unit.toLowerCase().trim();
        
        // Garantir unidades padronizadas para agrupamento
        if (normUnit.match(/^(g|grama|gramas)$/)) { normUnit = 'g'; }
        else if (normUnit.match(/^(ml|mililitro|mililitros)$/)) { normUnit = 'ml'; }
        else if (normUnit.match(/^(kg|quilo)$/)) { normUnit = 'kg'; }
        else if (normUnit.match(/^(l|litro)$/)) { normUnit = 'l'; }
        else if (normUnit.match(/unid|un\b|^u$|^$/)) { normUnit = 'unid'; }
        
        const key = `${standardizedName}_${normUnit}`;
        const current = ingredientMap.get(key);
        if (current) {
          current.quantity += normQty;
        } else {
           ingredientMap.set(key, { name: standardizedName, quantity: normQty, unit: normUnit, category });
        }
      });
      
      const newItems: ShoppingItem[] = [];
      let nextId = Date.now();
      
      ingredientMap.forEach((data, key) => {
        const name = data.name;
        const nLower = name.toLowerCase();
        
        // Arredonda para cima (Math.ceil) para itens unitários e líquidos em embalagem
        const isUnitary = data.unit === "unid" || 
                         (data.unit === "l" && nLower.includes("leite")) ||
                         nLower.match(/ovo|ovos|lata|caixa|garrafa|maço|pacote|pote|garrafa/);
                         
        let finalQuantity: number;
        if (isUnitary) {
           finalQuantity = Math.ceil(data.quantity);
        } else {
           // Arredonda para cima com 2 casas decimais
           finalQuantity = Math.ceil(data.quantity * 100) / 100;
        }

        newItems.push({
          id: (nextId++).toString(),
          name: name.charAt(0).toUpperCase() + name.slice(1),
          category: data.category as any,
          quantity: `${finalQuantity} ${data.unit}`.trim(),
          completed: false,
          isManual: false
        });
      });
      
      const manualItems = items.filter(i => i.isManual);
      const combined = [...manualItems, ...newItems];
      
      setItems(combined);
      await saveList(combined);
      
      setToastMessage("Lista sincronizada com sucesso!");
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err) {
      console.error(err);
      setToastMessage("Erro ao sincronizar com o cardápio.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;


  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
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

      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-outline-variant/30 pb-6">
        <div className="md:col-span-8">
          <h2 className="font-serif text-3xl font-bold text-primary">Lista de Compras</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">Ingredientes para formulações semanais.</p>
        </div>
        <div className="md:col-span-4 bg-lab-white p-4 rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-primary flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> {completedCount}/{totalCount} Adquiridos</span>
            <span className="text-gold-leaf">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2"><div className="bg-primary h-full rounded-full" style={{ width: `${progressPercentage}%` }} /></div>
        </div>
      </section>

      <section className="bg-white border border-outline-variant/30 rounded-xl p-5 shadow-sm max-w-xl">
        <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Adicionar novo insumo..." className="flex-1 px-4 py-2.5 bg-lab-white border rounded-lg outline-none text-xs" />
          <select value={newItemCategory} onChange={(e: any) => setNewItemCategory(e.target.value)} className="px-3 py-2.5 bg-lab-white border rounded-lg text-xs">
            <option value="Produtos Genéricos">Produtos Genéricos</option>
            <option value="Hortifruti">Hortifruti</option>
            <option value="Laticínios & Ovos">Laticínios & Ovos</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={generateFromPlan} className="px-3 bg-lab-white border rounded-lg text-secondary"><Sparkles className="w-4 h-4" /></button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">Adicionar</button>
          </div>
        </form>
      </section>

      <section className="bg-lab-white/40 border border-outline-variant/30 rounded-xl p-6 shadow-sm">
        <div className="space-y-3">
          <div className="space-y-6">
            {Object.entries(
              [...items]
                .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
                .reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, typeof items>)
            ).map(([category, catItems]) => (
              <div key={category}>
                <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-wider mb-2 pb-1 border-b border-outline-variant/30 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {category}
                </h3>
                <div className="space-y-0 pl-3 border-l border-outline-variant/20">
                  <AnimatePresence>
                    {(catItems as ShoppingItem[]).map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between py-2 border-b border-outline-variant/10 group last:border-0"
                      >
                        <div
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                        >
                          <button className="focus:outline-none text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
                            {item.completed ? (
                              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-white">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded border border-outline-variant/80 bg-white" />
                            )}
                          </button>
                          <div className="grid grid-cols-[1fr_auto] items-center gap-4 flex-1 pr-4">
                            <span
                              className={`font-sans text-sm font-medium leading-tight truncate ${
                                item.completed ? "text-scientific-gray line-through" : "text-primary"
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className={`font-sans text-xs w-20 text-right ${item.completed ? "text-scientific-gray/60" : "text-scientific-gray"}`}>
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-outline hover:text-error transition-colors focus:outline-none flex-shrink-0 p-1"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <p className="font-sans text-sm text-scientific-gray italic py-4 text-center">A lista de compras está vazia.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
}
