import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { ShoppingItem } from "../types";
import { shoppingService } from "../services/shoppingService";

interface ShoppingListProps {
  familyId: string | null;
}

export default function ShoppingList({ familyId }: ShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<"Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos">("Produtos Genéricos");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!familyId) return;
      setLoading(true);
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
    setToastMessage("Sincronização em tempo real ativa! Seus ingredientes são atualizados conforme o Cardápio.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;


  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
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
          <AnimatePresence>
            {[...items].sort((a, b) => a.category.localeCompare(b.category)).map((item) => (
              <motion.div
                key={item.id}
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
          {items.length === 0 && (
            <p className="font-sans text-sm text-scientific-gray italic py-4 text-center">A lista de compras está vazia.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
}
