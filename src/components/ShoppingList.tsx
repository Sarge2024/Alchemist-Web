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
    setToastMessage("Analisando protocolo semanal e gerando insumos...");
    setTimeout(() => {
      const generated: ShoppingItem[] = [
        { id: Date.now() + "1", name: "Ovos Orgânicos", category: "Laticínios & Ovos", quantity: "1 dúzia", completed: false, isManual: true },
        { id: Date.now() + "2", name: "Salmão", category: "Produtos Genéricos", quantity: "500g", completed: false, isManual: true }
      ];
      const newItems = [...items, ...generated];
      setItems(newItems);
      saveList(newItems);
      setToastMessage("Lista atualizada com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const hortifrutiItems = items.filter((item) => item.category === "Hortifruti");
  const dairyItems = items.filter((item) => item.category === "Laticínios & Ovos");
  const genericItems = items.filter((item) => item.category === "Produtos Genéricos");

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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-lab-white/40 border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-md font-bold text-primary mb-1 pb-2 border-b border-outline-variant/20">
              Hortifruti
            </h4>
            <p className="font-sans text-[10px] text-scientific-gray uppercase tracking-wider mb-4 font-semibold">
              Orgânicos & Selecionados
            </p>

            <div className="space-y-3">
              <AnimatePresence>
                {hortifrutiItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between py-1 border-b border-outline-variant/10 group"
                  >
                    <div
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <button className="focus:outline-none text-on-surface-variant hover:text-primary transition-colors">
                        {item.completed ? (
                          <div className="w-4.5 h-4.5 rounded bg-secondary flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded border border-outline-variant/80 bg-white" />
                        )}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-sans text-xs font-medium leading-tight truncate ${
                            item.completed ? "text-scientific-gray line-through" : "text-primary"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="font-sans text-[10px] text-scientific-gray mt-0.5">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.isManual && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-outline hover:text-error transition-colors focus:outline-none"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {hortifrutiItems.length === 0 && (
                <p className="font-sans text-xs text-scientific-gray italic py-4">Nenhum ingrediente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Category 2: Laticínios */}
        <div className="bg-lab-white/40 border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-md font-bold text-primary mb-1 pb-2 border-b border-outline-variant/20">
              Laticínios & Ovos
            </h4>
            <p className="font-sans text-[10px] text-scientific-gray uppercase tracking-wider mb-4 font-semibold">
              Lácteos Curados & Caipiras
            </p>

            <div className="space-y-3">
              <AnimatePresence>
                {dairyItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between py-1 border-b border-outline-variant/10 group"
                  >
                    <div
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <button className="focus:outline-none text-on-surface-variant hover:text-primary transition-colors">
                        {item.completed ? (
                          <div className="w-4.5 h-4.5 rounded bg-secondary flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded border border-outline-variant/80 bg-white" />
                        )}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-sans text-xs font-medium leading-tight truncate ${
                            item.completed ? "text-scientific-gray line-through" : "text-primary"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="font-sans text-[10px] text-scientific-gray mt-0.5">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.isManual && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-outline hover:text-error transition-colors focus:outline-none"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {dairyItems.length === 0 && (
                <p className="font-sans text-xs text-scientific-gray italic py-4">Nenhum ingrediente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Category 3: Produtos Genéricos */}
        <div className="bg-lab-white/40 border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-md font-bold text-primary mb-1 pb-2 border-b border-outline-variant/20">
              Produtos Genéricos
            </h4>
            <p className="font-sans text-[10px] text-scientific-gray uppercase tracking-wider mb-4 font-semibold">
              Utilidades & Condimentos
            </p>

            <div className="space-y-3">
              <AnimatePresence>
                {genericItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between py-1 border-b border-outline-variant/10 group"
                  >
                    <div
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <button className="focus:outline-none text-on-surface-variant hover:text-primary transition-colors">
                        {item.completed ? (
                          <div className="w-4.5 h-4.5 rounded bg-secondary flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded border border-outline-variant/80 bg-white" />
                        )}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-sans text-xs font-medium leading-tight truncate ${
                            item.completed ? "text-scientific-gray line-through" : "text-primary"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="font-sans text-[10px] text-scientific-gray mt-0.5">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-outline hover:text-error opacity-70 hover:opacity-100 transition-all focus:outline-none"
                      title="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {genericItems.length === 0 && (
                <p className="font-sans text-xs text-scientific-gray italic py-4">Nenhum produto genérico cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
