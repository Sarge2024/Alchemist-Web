import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Search, Zap, Droplet, Apple, Clock, ChevronLeft, ChevronRight, Activity, CalendarDays, Check, Calendar, Cookie, Coffee } from "lucide-react";
import { LogEntry, ConsumptionLogDoc } from "../types";
import { consumptionService } from "../services/consumptionService";

interface ConsumptionHistoryProps {
  familyId: string | null;
  activeProfileId: string | null;
}

export default function ConsumptionHistory({ familyId, activeProfileId }: ConsumptionHistoryProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [logDocId, setLogDocId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [searchFoodQuery, setSearchFoodQuery] = useState<string>("");
  const [loggedQuantity, setLoggedQuantity] = useState<number>(1);
  const [loggedUnit, setLoggedUnit] = useState<string>("Unidades");
  const [loggedTime, setLoggedTime] = useState<string>(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [loggedCategory, setLoggedCategory] = useState<string>("Lanche");

  // Mock database for eventual search items
  const presetFoodDatabase = [
    { name: "Biscoito de Arroz Integral", calPerUnit: 40, detail: "Finas bolachas de arroz tufado" },
    { name: "Café Espresso Duplo", calPerUnit: 5, detail: "Espresso curto premium sem açúcar" },
    { name: "Mix de Castanhas Selecionadas", calPerUnit: 160, detail: "Castanhas do Pará, de Caju e Amêndoas" },
    { name: "Iogurte Natural Puro de Cabra", calPerUnit: 110, detail: "Iogurte de alta digestibilidade" },
  ];

  useEffect(() => {
    async function loadData() {
      if (!familyId || !activeProfileId) return;
      setLoading(true);
      try {
        const dateId = consumptionService.formatDateId(currentDate);
        setLogDocId(dateId);
        const doc = await consumptionService.getDayLogs(familyId, activeProfileId, dateId);
        if (doc) {
          setEntries(doc.entries);
        } else {
          setEntries([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentDate, familyId, activeProfileId]);

  const saveEntries = async (newEntries: LogEntry[]) => {
    if (!familyId || !activeProfileId) return;
    try {
      const dateId = consumptionService.formatDateId(currentDate);
      const logDoc: ConsumptionLogDoc = {
        id: dateId,
        familyId,
        profileId: activeProfileId,
        entries: newEntries,
        totalCalories: newEntries.reduce((acc, curr) => acc + curr.calories, 0),
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0
      };
      await consumptionService.saveDayLogs(logDoc);
    } catch (e) {
      console.error(e);
    }
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const removeEntry = (id: string) => {
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);
    saveEntries(newEntries);
  };

  const handleSelectPreset = (foodName: string) => {
    setSearchFoodQuery(foodName);
  };

  const handleAddCustomLog = (e: FormEvent) => {
    e.preventDefault();
    if (!searchFoodQuery.trim()) return;

    const match = presetFoodDatabase.find(
      (f) => f.name.toLowerCase() === searchFoodQuery.toLowerCase()
    );
    const unitCal = match ? match.calPerUnit : 80;
    const calculatedCal = unitCal * loggedQuantity;

    const newLog: LogEntry = {
      id: `log-custom-${Date.now()}`,
      time: loggedTime,
      foodName: searchFoodQuery.trim(),
      category: "Ocasional",
      details: `${loggedQuantity} ${loggedUnit} • Registro de Consumo Eventual`,
      calories: calculatedCal,
    };

    const newEntries = [newLog, ...entries];
    setEntries(newEntries);
    saveEntries(newEntries);
    
    setSearchFoodQuery("");
    setToastMessage(`Consumo de "${newLog.foodName}" registrado!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalCalories = entries.reduce((sum, item) => sum + item.calories, 0);
  const targetCalories = 2450;
  const calPercent = Math.min(Math.round((totalCalories / targetCalories) * 100), 100);

  const activeMatch = presetFoodDatabase.find(
    (f) => f.name.toLowerCase() === searchFoodQuery.toLowerCase()
  );
  const currentUnitCal = activeMatch ? activeMatch.calPerUnit : 80;
  const liveCaloriePreview = currentUnitCal * loggedQuantity;
  
  const dateStr = currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

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

      {/* Date picking Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Registro de Consumo</h2>
          <p className="font-sans text-sm text-scientific-gray mt-1">
            Diário metabólico em tempo real para controle de ingestão e conformidade.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-lab-white p-1 rounded-xl border border-outline-variant/40 shadow-sm">
          <button onClick={prevDay} className="w-9 h-9 flex items-center justify-center hover:bg-sage-wash rounded-lg text-primary transition-colors focus:outline-none cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 font-serif text-sm font-semibold text-primary flex items-center gap-2 capitalize">
            <Calendar className="w-4 h-4 text-secondary" /> {dateStr}
          </span>
          <button onClick={nextDay} className="w-9 h-9 flex items-center justify-center hover:bg-sage-wash rounded-lg text-primary transition-colors focus:outline-none cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Dials / Performance analysis block */}
      <section className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-sm">
        <h3 className="font-serif text-sm font-semibold text-primary mb-5 uppercase tracking-wider text-center sm:text-left">
          Absorção Energética Diária
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Calorie Progress dial gauge */}
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="relative w-32 h-32 mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-surface-container"
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <motion.circle
                  className="text-primary"
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - calPercent }}
                  transition={{ duration: 0.6 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-xl font-bold text-primary">{totalCalories}</span>
                <span className="font-sans text-[9px] uppercase font-bold text-scientific-gray">kcal</span>
              </div>
            </div>
            <span className="font-sans text-xs font-semibold text-scientific-gray uppercase tracking-widest">
              Total Acumulado
            </span>
            <span className="font-sans text-[10px] text-on-surface-variant font-medium mt-0.5">Meta: {targetCalories} kcal</span>
          </div>

          {/* Quick micro nutritional breakdown */}
          <div className="sm:col-span-2 space-y-4">
            <h4 className="font-serif text-sm font-semibold text-primary pb-1.5 border-b border-outline-variant/10">
              Absorção Acumulada
            </h4>
            
            <div className="space-y-3 font-sans text-xs">
              {/* Protein Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-primary uppercase tracking-wider text-[10px]">Proteínas</span>
                  <span className="text-primary">85g / 120g</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "70.8%" }} />
                </div>
              </div>

              {/* Fibers Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gold-leaf uppercase tracking-wider text-[10px]">Fibras</span>
                  <span className="text-gold-leaf">22g / 30g</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-gold-leaf h-full rounded-full" style={{ width: "73.3%" }} />
                </div>
              </div>

              {/* Fats Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-secondary uppercase tracking-wider text-[10px]">Gorduras</span>
                  <span className="text-secondary">48g / 65g</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "73.8%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chronological logs & Add Log Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Chronological Consume Logs */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-serif text-md font-bold text-primary flex items-center gap-2 mb-2">
            <Clock className="w-4.5 h-4.5 text-secondary" /> Diário de Consumo
          </h3>

          {entries.length === 0 ? (
            <div className="text-center py-10 bg-lab-white rounded-xl border border-dashed border-outline-variant/40">
              <span className="text-scientific-gray font-sans text-sm">Nenhum consumo registrado neste dia.</span>
            </div>
          ) : (
            <div className="relative border-l border-outline-variant/30 pl-4 ml-2.5 space-y-6">
              <AnimatePresence>
                {entries.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative group"
                  >
                    {/* Bullet indicator */}
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border border-primary bg-white group-hover:bg-primary transition-colors" />

                    <div className="bg-lab-white/40 border border-outline-variant/20 hover:border-outline-variant/50 rounded-xl p-4 shadow-sm flex justify-between items-start transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider">
                            {log.time}
                          </span>
                          <h4 className="font-sans text-sm font-semibold text-primary">
                            {log.foodName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                            log.category === "Planejado"
                              ? "bg-secondary-container text-on-secondary-container"
                              : "bg-surface-container text-scientific-gray"
                          }`}>
                            {log.category}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-scientific-gray leading-relaxed">
                          {log.details}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="font-serif text-sm font-bold text-primary ml-4">
                          {log.calories} kcal
                        </span>
                        <button onClick={() => removeEntry(log.id)} className="text-outline hover:text-error transition-colors focus:outline-none cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Eventual custom consume logger */}
        <div className="lg:col-span-5 bg-lab-white border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif text-md font-bold text-primary">Consumo Eventual</h3>
            <p className="font-sans text-xs text-scientific-gray mt-1">
              Registre alimentos avulsos ou lanches ocasionais consumidos fora do protocolo.
            </p>
          </div>

          {/* Quick presets selectors */}
          <div className="space-y-2">
            <span className="font-sans text-[9px] uppercase font-bold text-scientific-gray tracking-wider block">
              Atalhos Rápidos
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset("Biscoito de Arroz Integral")}
                className="px-2.5 py-1.5 rounded bg-white text-primary border border-outline-variant/30 font-sans text-[10px] font-semibold hover:bg-sage-wash/60 transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
              >
                <Cookie className="w-3.5 h-3.5 text-gold-leaf" /> Biscoito de Arroz
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("Café Espresso Duplo")}
                className="px-2.5 py-1.5 rounded bg-white text-primary border border-outline-variant/30 font-sans text-[10px] font-semibold hover:bg-sage-wash/60 transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
              >
                <Coffee className="w-3.5 h-3.5 text-secondary" /> Café Espresso
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("Mix de Castanhas Selecionadas")}
                className="px-2.5 py-1.5 rounded bg-white text-primary border border-outline-variant/30 font-sans text-[10px] font-semibold hover:bg-sage-wash/60 transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
              >
                <Apple className="w-3.5 h-3.5 text-primary" /> Castanhas
              </button>
            </div>
          </div>

          <form onSubmit={handleAddCustomLog} className="space-y-4 font-sans text-xs">
            {/* Search or write custom food name */}
            <div>
              <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider">
                Nome do Alimento
              </label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-outline" />
                <input
                  type="text"
                  required
                  value={searchFoodQuery}
                  onChange={(e) => setSearchFoodQuery(e.target.value)}
                  placeholder="Ex: Biscoito de Arroz, Barra de Proteína..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/40 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Quantity and units selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={loggedQuantity}
                  onChange={(e) => setLoggedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white border border-outline-variant/40 rounded-lg outline-none font-bold text-primary"
                />
              </div>

              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Medida
                </label>
                <select
                  value={loggedUnit}
                  onChange={(e) => setLoggedUnit(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-outline-variant/40 rounded-lg outline-none"
                >
                  <option value="Unidades">Unidades</option>
                  <option value="Gramas">Gramas</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            {/* Time and Meal Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Horário
                </label>
                <input
                  type="time"
                  required
                  value={loggedTime}
                  onChange={(e) => setLoggedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-outline-variant/40 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Refeição
                </label>
                <select
                  value={loggedCategory}
                  onChange={(e) => setLoggedCategory(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-outline-variant/40 rounded-lg outline-none"
                >
                  <option value="Café da Manhã">Café da Manhã</option>
                  <option value="Almoço">Almoço</option>
                  <option value="Café da Tarde">Café da Tarde</option>
                  <option value="Lanche">Lanche</option>
                  <option value="Jantar">Jantar</option>
                  <option value="Ceia">Ceia</option>
                </select>
              </div>
            </div>

            {/* Animated preview estimate area */}
            <div className="bg-white p-4 rounded-lg border border-outline-variant/30 flex justify-between items-center">
              <div>
                <span className="font-sans text-[10px] uppercase font-bold text-scientific-gray tracking-wider">
                  Estimativa Energética
                </span>
                <span className="block text-primary font-bold text-base mt-0.5">
                  {liveCaloriePreview} kcal
                </span>
              </div>
              <span className="text-[10px] text-scientific-gray italic">
                *Baseado no banco científico
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-sans text-xs font-bold rounded-lg hover:opacity-90 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-primary-fixed" />
              <span>REGISTRAR CONSUMO</span>
            </button>
          </form>
        </div>
      </section>
    </motion.div>
  );
}
