import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Square, Plus, Trash2, ShoppingCart } from "lucide-react";
import { ShoppingItem } from "../types";

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: "s-1", name: "Abobrinha Orgânica", category: "Hortifruti", quantity: "2 unidades", completed: true },
    { id: "s-2", name: "Tomate Cereja Selecionado", category: "Hortifruti", quantity: "150g", completed: true },
    { id: "s-3", name: "Espinafre Orgânico", category: "Hortifruti", quantity: "1 maço", completed: false },
    { id: "s-4", name: "Rúcula de Cultivo Protegido", category: "Hortifruti", quantity: "1 maço", completed: false },
    { id: "s-5", name: "Aspargos Verdes Frescos", category: "Hortifruti", quantity: "200g", completed: false },
    
    { id: "s-6", name: "Ovos Caipiras Orgânicos", category: "Laticínios & Ovos", quantity: "10 unidades", completed: true },
    { id: "s-7", name: "Iogurte Natural de Ovelha", category: "Laticínios & Ovos", quantity: "2 potes", completed: false },
    { id: "s-8", name: "Queijo de Cabra Curado", category: "Laticínios & Ovos", quantity: "150g", completed: false },

    { id: "s-9", name: "Azeite de Oliva Extra Virgem", category: "Produtos Genéricos", quantity: "1 garrafa", completed: false, isManual: true },
    { id: "s-10", name: "Filtro de Café de Papel", category: "Produtos Genéricos", quantity: "1 pacote", completed: false, isManual: true },
  ]);

  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<"Hortifruti" | "Laticínios & Ovos" | "Produtos Genéricos">("Produtos Genéricos");

  const toggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `s-manual-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: "1 unid",
      completed: false,
      isManual: true,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName("");
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by category
  const hortifrutiItems = items.filter((item) => item.category === "Hortifruti");
  const dairyItems = items.filter((item) => item.category === "Laticínios & Ovos");
  const genericItems = items.filter((item) => item.category === "Produtos Genéricos");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="space-y-8 pb-12"
    >
      {/* Header and Progress widget */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-b border-outline-variant/30 pb-6">
        <div className="md:col-span-8">
          <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Lista de Compras</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">
            Ingredientes necessários para as suas formulações moleculares semanais.
          </p>
        </div>

        {/* Progress meter */}
        <div className="md:col-span-4 bg-lab-white p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-sans font-semibold">
            <span className="text-primary flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-secondary" /> {completedCount}/{totalCount} Adquiridos
            </span>
            <span className="text-gold-leaf">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </section>

      {/* Manual Product Creator Form */}
      <section className="bg-white border border-outline-variant/30 rounded-xl p-5 shadow-sm max-w-xl">
        <h3 className="font-serif text-sm font-semibold text-primary mb-3">Adicionar Item Manual</h3>
        <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Ex: Papel Toalha, Azeite de Oliva..."
            className="flex-1 px-4 py-2.5 bg-lab-white border border-outline-variant/50 rounded-lg focus:border-gold-leaf outline-none font-sans text-xs"
          />
          <select
            value={newItemCategory}
            onChange={(e: any) => setNewItemCategory(e.target.value)}
            className="px-3 py-2.5 bg-lab-white border border-outline-variant/50 rounded-lg outline-none font-sans text-xs text-primary"
          >
            <option value="Produtos Genéricos">Produtos Genéricos</option>
            <option value="Hortifruti">Hortifruti</option>
            <option value="Laticínios & Ovos">Laticínios & Ovos</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-white font-sans text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4 text-primary-fixed" />
            <span>Adicionar</span>
          </button>
        </form>
      </section>

      {/* Categories container */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Category 1: Hortifruti */}
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
