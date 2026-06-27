import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, Edit, Trash2, Plus, AlertCircle, Check, UserPlus, Globe, HelpCircle, MessageCircle } from "lucide-react";
import { Profile, Invite, Role } from "../types";

interface FamilySectionProps {
  profiles: Profile[];
  onProfilesChange: (updated: Profile[]) => void;
  activeProfileId: string;
  onSelectActiveProfile: (id: string) => void;
  familyId?: string | null;
}

export default function FamilySection({
  profiles,
  onProfilesChange,
  activeProfileId,
  onSelectActiveProfile,
  familyId,
}: FamilySectionProps) {
  // Navigation states: "list", "edit", "add"
  const [mode, setMode] = useState<"list" | "edit" | "add">("list");
  
  // Member profile we are currently editing
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newDependentName, setNewDependentName] = useState("");
  const [newDependentEmail, setNewDependentEmail] = useState("");
  const [newDependentRelationship, setNewDependentRelationship] = useState("");
  const [newDependentRole, setNewDependentRole] = useState("Dependente");
  const [isAdding, setIsAdding] = useState(false);

  // Allergies & dietary preset helpers
  const availableAllergies = ["Amendoim", "Glúten", "Lactose", "Frutos do Mar", "Soja", "Nozes"];
  const availableProtocols = ["Vegano", "Cetogênico", "Baixo Carbo", "Equilibrado", "Paleo"];

  const showEditProfile = (profile: Profile) => {
    setEditingProfile({ ...profile });
    setMode("edit");
  };

  const handleAllergyToggle = (allergy: string) => {
    if (!editingProfile) return;
    const current = editingProfile.allergies;
    const updated = current.includes(allergy)
      ? current.filter((a) => a !== allergy)
      : [...current, allergy];
    setEditingProfile({ ...editingProfile, allergies: updated });
  };

  const handleProtocolToggle = (protocol: string) => {
    if (!editingProfile) return;
    const current = editingProfile.dietaryProtocol;
    const updated = current.includes(protocol)
      ? current.filter((p) => p !== protocol)
      : [...current, protocol];
    setEditingProfile({ ...editingProfile, dietaryProtocol: updated });
  };

  const saveProfileChanges = () => {
    if (!editingProfile) return;

    // Check macros sum to 100%
    const sum = editingProfile.proteinPercentage + editingProfile.carbsPercentage + editingProfile.fatPercentage;
    if (sum !== 100) {
      alert("A soma dos percentuais de macronutrientes deve ser exatamente 100%. Atualmente é " + sum + "%.");
      return;
    }

    // Update main metric representation based on daily calories / macros
    const protGrams = Math.round((editingProfile.dailyCalories * (editingProfile.proteinPercentage / 100)) / 4);
    const updatedWithMetric = {
      ...editingProfile,
      mainMetric: `${protGrams}g Meta de Proteína`,
      metricValue: protGrams,
      progressPercentage: Math.min(Math.round((105 / protGrams) * 100), 100)
    };

    const updatedProfiles = profiles.map((p) => (p.id === editingProfile.id ? updatedWithMetric : p));
    onProfilesChange(updatedProfiles);
    
    if (familyId) {
      import("../services/userService").then(({ userService }) => {
        userService.updateMemberProfile(familyId, editingProfile.id, updatedWithMetric).catch(console.error);
      });
    }
    
    setToastMessage(`Configurações de ${editingProfile.name} salvas com sucesso.`);
    setMode("list");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const deleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      alert("Você deve manter pelo menos um perfil familiar ativo.");
      return;
    }
    
    if (familyId) {
      try {
        const { userService } = await import("../services/userService");
        await userService.deleteMember(familyId, profileId);
      } catch (err) {
        console.error("Erro ao deletar perfil", err);
      }
    }
    
    const filtered = profiles.filter((p) => p.id !== profileId);
    onProfilesChange(filtered);
    if (activeProfileId === profileId) {
      onSelectActiveProfile(filtered[0].id);
    }
    setToastMessage("Perfil familiar removido.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddDependent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDependentName.trim() || !newDependentRelationship.trim() || !familyId) return;

    setIsAdding(true);
    try {
      const { userService } = await import("../services/userService");
      const newProfile = await userService.addDependent(familyId, {
        name: newDependentName,
        email: newDependentEmail,
        relationship: newDependentRelationship,
        role: newDependentRole,
      });
      
      onProfilesChange([...profiles, newProfile]);
      setToastMessage(`Dependente ${newProfile.name} adicionado com sucesso.`);
      
      // Reset form
      setNewDependentName("");
      setNewDependentEmail("");
      setNewDependentRelationship("");
      setNewDependentRole("Dependente");
      setMode("list");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar dependente.");
    } finally {
      setIsAdding(false);
    }
  };

  // Live macro calculation helper for rendering
  const getMacroGrams = (calories: number, pct: number, type: "prot" | "carb" | "fat") => {
    const divisor = type === "fat" ? 9 : 4;
    return Math.round((calories * (pct / 100)) / divisor);
  };

  return (
    <div className="space-y-8 pb-12">
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

      {/* VIEW 1: Family Member Roster list */}
      {mode === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary tracking-tight">Lista da Família</h2>
            <p className="font-sans text-sm text-scientific-gray mt-1">
              Gerencie membros da família, permissões de compartilhamento biológico e perfis nutricionais ativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Map actual profiles */}
            {profiles.map((p) => {
              const isActive = activeProfileId === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-lab-white border rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative ${
                    isActive ? "border-primary border-2 shadow-sm" : "border-outline-variant/40"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-4 right-4 text-[9px] font-sans font-bold bg-primary text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Ativo
                    </span>
                  )}

                  <div>
                    {/* Header: avatar + name */}
                    <div className="flex items-center gap-3.5 mb-5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant bg-surface flex-shrink-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif text-base font-bold text-primary truncate leading-snug">
                          {p.name}
                        </h4>
                        <p className="font-sans text-xs text-scientific-gray leading-none mt-0.5">
                          {p.role} {p.relationship ? `• ${p.relationship}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Quick biological stats */}
                    <div className="space-y-2 bg-white/70 p-3 rounded-lg border border-outline-variant/20 mb-5">
                      <div className="flex justify-between items-center text-[10px] font-sans font-semibold">
                        <span className="text-scientific-gray uppercase tracking-wider">Meta</span>
                        <span className="text-primary font-bold">{p.mainMetric}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-sans font-semibold">
                        <span className="text-scientific-gray uppercase tracking-wider">Dieta</span>
                        <span className="text-secondary font-bold">
                          {p.dietaryProtocol.length > 0 ? p.dietaryProtocol.join(", ") : "Geral"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-sans font-semibold">
                        <span className="text-scientific-gray uppercase tracking-wider">Alergias</span>
                        <span className="text-gold-leaf font-bold">
                          {p.allergies.length > 0 ? p.allergies.join(", ") : "Nenhuma"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Action Button */}
                  {p.phone && p.phone.trim() !== "" && (
                    <a
                      href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${p.name}, acesse seu perfil no Alchemist Web através deste link: https://alchemist-web-psi.vercel.app/`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-2 px-3 rounded-lg border border-[#25D366]/30 transition-colors text-xs font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar WhatsApp
                    </a>
                  )}

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-outline-variant/10 flex gap-2">
                    {!isActive && (
                      <button
                        onClick={() => onSelectActiveProfile(p.id)}
                        className="flex-1 py-2 bg-sage-wash hover:bg-sage-wash/80 text-primary font-sans text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        Ativar Perfil
                      </button>
                    )}
                    <button
                      onClick={() => showEditProfile(p)}
                      className={`py-2 px-3 border border-outline-variant/60 hover:border-primary text-primary font-sans text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive ? "flex-1" : ""
                      }`}
                      title="Editar Configurações"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Configurar</span>
                    </button>

                    {!p.isMainAccount && (
                      <button
                        onClick={() => deleteProfile(p.id)}
                        className="p-2 border border-outline-variant/40 hover:border-error hover:text-error rounded text-outline transition-colors focus:outline-none"
                        title="Remover Perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add member creator card */}
            <div
              onClick={() => setMode("add")}
              className="border-2 border-dashed border-outline-variant/50 rounded-xl p-6 hover:bg-lab-white/40 hover:border-primary transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
            >
              <UserPlus className="w-8 h-8 text-secondary mb-3" />
              <h4 className="font-serif text-base font-bold text-primary">Adicionar Dependente</h4>
              <p className="font-sans text-xs text-scientific-gray max-w-[200px] mt-1.5 leading-relaxed">
                Adicione cônjuge, filhos ou membros da família ao seu grupo.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: Subject Profile Settings Form view */}
      {mode === "edit" && editingProfile && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Form Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode("list")}
              className="p-2 border border-outline-variant/60 rounded-full hover:bg-sage-wash hover:text-primary transition-colors focus:outline-none cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary tracking-tight">
                Configurações Nutricionais
              </h2>
              <p className="font-sans text-sm text-scientific-gray mt-1">
                Ajuste os parâmetros moleculares e metabólicos de {editingProfile.name}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left spec profile Column (Specimen details & info) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile card box */}
              <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-6 text-center shadow-sm">
                <span className="font-sans text-[9px] uppercase font-bold text-scientific-gray tracking-wider mb-4 block">
                  Espécime Familiar
                </span>

                <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border border-outline-variant/80 bg-white">
                  <img
                    src={editingProfile.avatar}
                    alt={editingProfile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="font-sans text-[10px] text-white font-semibold uppercase tracking-wider">
                      Alterar Foto
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-primary leading-tight">
                  {editingProfile.name}
                </h3>
                <p className="font-sans text-xs text-scientific-gray mt-1">{editingProfile.role}</p>

                <div className="pt-4 mt-4 border-t border-outline-variant/20 space-y-4 text-left">
                  {/* Grau de Parentesco */}
                  <div>
                    <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Grau de Parentesco
                    </label>
                    <select
                      value={editingProfile.relationship || ""}
                      onChange={(e) => setEditingProfile({ ...editingProfile, relationship: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-outline-variant/50 rounded outline-none font-sans text-xs"
                    >
                      <option value="">Selecione...</option>
                      <option value="Eu mesmo(a)">Eu mesmo(a)</option>
                      <option value="Esposa">Esposa</option>
                      <option value="Marido">Marido</option>
                      <option value="Filho(a)">Filho(a)</option>
                      <option value="Mãe">Mãe</option>
                      <option value="Pai">Pai</option>
                      <option value="Amigo(a)">Amigo(a)</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Celular / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 5511999999999"
                      value={editingProfile.phone || ""}
                      onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-outline-variant/50 rounded outline-none font-sans text-xs"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: usuario@email.com"
                      value={editingProfile.email || ""}
                      onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-outline-variant/50 rounded outline-none font-sans text-xs"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-sans font-semibold pt-2 border-t border-outline-variant/20">
                    <span className="text-scientific-gray">Conta Principal</span>
                    <span className="text-primary">{editingProfile.isMainAccount ? "Sim" : "Não"}</span>
                  </div>
                </div>
              </div>

              {/* Interface settings */}
              <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-4">
                <h4 className="font-serif text-sm font-bold text-primary flex items-center gap-2">
                  <Globe className="w-4 h-4 text-secondary" /> Parâmetros do Sistema
                </h4>
                
                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-scientific-gray font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                      Fuso Horário
                    </label>
                    <select
                      value={editingProfile.timezone}
                      onChange={(e) => setEditingProfile({ ...editingProfile, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-outline-variant/50 rounded outline-none font-sans"
                    >
                      <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-scientific-gray font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                      Sistema de Medidas
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, measurementSystem: "metric" })}
                        className={`flex-1 py-1.5 text-center font-semibold rounded border cursor-pointer transition-all ${
                          editingProfile.measurementSystem === "metric"
                            ? "bg-primary border-primary text-white"
                            : "border-outline-variant/50 text-primary hover:bg-sage-wash/50"
                        }`}
                      >
                        Métrico
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, measurementSystem: "imperial" })}
                        className={`flex-1 py-1.5 text-center font-semibold rounded border cursor-pointer transition-all ${
                          editingProfile.measurementSystem === "imperial"
                            ? "bg-primary border-primary text-white"
                            : "border-outline-variant/50 text-primary hover:bg-sage-wash/50"
                        }`}
                      >
                        Imperial
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right configuration panel (Diet, Allergies, Targets) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Allergies and diet presets */}
              <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="font-serif text-md font-bold text-primary">Alergias e Protocolos Alimentares</h4>
                  <p className="font-sans text-xs text-scientific-gray mt-1">
                    Defina intolerâncias e padrões metabólicos prioritários.
                  </p>
                </div>

                {/* Dietary Protocols Preset selection */}
                <div className="space-y-3">
                  <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block">
                    Protocolos Alimentares Escolhidos
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableProtocols.map((protocol) => {
                      const isSelected = editingProfile.dietaryProtocol.includes(protocol);
                      return (
                        <button
                          key={protocol}
                          type="button"
                          onClick={() => handleProtocolToggle(protocol)}
                          className={`px-3 py-1.5 rounded-full font-sans text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-secondary text-white border-secondary"
                              : "bg-sage-wash/40 text-primary border-outline-variant/40 hover:bg-sage-wash"
                          }`}
                        >
                          {protocol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Allergies selection */}
                <div className="space-y-3">
                  <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block">
                    Intolerâncias & Restrições Clínicas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableAllergies.map((allergy) => {
                      const isSelected = editingProfile.allergies.includes(allergy);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => handleAllergyToggle(allergy)}
                          className={`px-3 py-1.5 rounded font-sans text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gold-leaf text-white border-gold-leaf shadow-sm"
                              : "bg-surface text-primary border-outline-variant/40 hover:bg-sage-wash"
                          }`}
                        >
                          {isSelected ? `Alergia: ${allergy}` : allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical description */}
                <div className="space-y-2">
                  <label className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider block">
                    Contexto Clínico (Medicamentos & Suplementos)
                  </label>
                  <textarea
                    value={editingProfile.medications}
                    onChange={(e) => setEditingProfile({ ...editingProfile, medications: e.target.value })}
                    placeholder="Ex: Suplementação de Metilfolato 400mcg e Ômega-3 no café da manhã."
                    rows={2}
                    className="w-full p-3 bg-lab-white border border-outline-variant/40 rounded-lg outline-none font-sans text-xs text-primary placeholder:text-outline"
                  />
                </div>
              </div>

              {/* Dynamic Targets & Macro slider calculations */}
              <div className="bg-white border border-outline-variant/40 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="font-serif text-md font-bold text-primary">Metas Nutricionais Dinâmicas</h4>
                  <p className="font-sans text-xs text-scientific-gray mt-1">
                    Ajuste o valor energético diário e os percentuais dos macronutrientes.
                  </p>
                </div>

                {/* Calorie slider */}
                <div className="space-y-3 bg-lab-white p-4 rounded-lg border border-outline-variant/10">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs font-bold text-primary uppercase tracking-wide">
                      Ingestão Energética Diária
                    </span>
                    <span className="font-serif text-lg font-bold text-primary">
                      {editingProfile.dailyCalories} <span className="text-xs text-scientific-gray">kcal</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1200"
                    max="4500"
                    step="50"
                    value={editingProfile.dailyCalories}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, dailyCalories: parseInt(e.target.value) })
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-scientific-gray font-mono">
                    <span>1.200 kcal</span>
                    <span>Meta Neutra</span>
                    <span>4.500 kcal</span>
                  </div>
                </div>

                {/* Macro Percent inputs with Warning check */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                    <span className="font-sans text-[10px] font-bold text-scientific-gray uppercase tracking-wider">
                      Distribuição de Macronutrientes
                    </span>
                    
                    {/* Sum check */}
                    {editingProfile.proteinPercentage + editingProfile.carbsPercentage + editingProfile.fatPercentage === 100 ? (
                      <span className="flex items-center gap-1 text-[10px] text-secondary font-sans font-bold bg-secondary-container/20 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3 stroke-[2.5]" /> Soma 100%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-gold-leaf font-sans font-bold bg-gold-leaf/10 px-2 py-0.5 rounded animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Diferença de {100 - (editingProfile.proteinPercentage + editingProfile.carbsPercentage + editingProfile.fatPercentage)}%
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
                    {/* Protein percentage input */}
                    <div className="bg-sage-wash/40 p-3 rounded border border-outline-variant/10">
                      <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-widest text-[9px]">
                        Proteína (30% padrão)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editingProfile.proteinPercentage}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              proteinPercentage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 px-2 py-1 bg-white border border-outline-variant/40 rounded outline-none font-bold text-primary"
                        />
                        <span className="font-semibold text-scientific-gray">%</span>
                      </div>
                      <span className="block text-[10px] text-primary/80 font-mono mt-2 font-semibold">
                        Grams: {getMacroGrams(editingProfile.dailyCalories, editingProfile.proteinPercentage, "prot")}g
                      </span>
                    </div>

                    {/* Carbs percentage input */}
                    <div className="bg-sage-wash/40 p-3 rounded border border-outline-variant/10">
                      <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-widest text-[9px]">
                        Carboidratos (45% padrão)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editingProfile.carbsPercentage}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              carbsPercentage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 px-2 py-1 bg-white border border-outline-variant/40 rounded outline-none font-bold text-primary"
                        />
                        <span className="font-semibold text-scientific-gray">%</span>
                      </div>
                      <span className="block text-[10px] text-primary/80 font-mono mt-2 font-semibold">
                        Grams: {getMacroGrams(editingProfile.dailyCalories, editingProfile.carbsPercentage, "carb")}g
                      </span>
                    </div>

                    {/* Fat percentage input */}
                    <div className="bg-sage-wash/40 p-3 rounded border border-outline-variant/10">
                      <label className="block text-scientific-gray font-semibold mb-1 uppercase tracking-widest text-[9px]">
                        Gorduras (25% padrão)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editingProfile.fatPercentage}
                          onChange={(e) =>
                            setEditingProfile({
                              ...editingProfile,
                              fatPercentage: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 px-2 py-1 bg-white border border-outline-variant/40 rounded outline-none font-bold text-primary"
                        />
                        <span className="font-semibold text-scientific-gray">%</span>
                      </div>
                      <span className="block text-[10px] text-primary/80 font-mono mt-2 font-semibold">
                        Grams: {getMacroGrams(editingProfile.dailyCalories, editingProfile.fatPercentage, "fat")}g
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={saveProfileChanges}
                  className="flex-1 bg-primary text-white font-sans text-xs font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <Save className="w-4 h-4 text-primary-fixed" />
                  <span>SALVAR ALTERAÇÕES</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="px-6 py-3 border border-outline-variant/60 text-primary font-sans text-xs font-bold rounded-lg hover:bg-sage-wash/50 transition-colors"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 3: Add Dependent View */}
      {mode === "add" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode("list")}
              className="p-2 border border-outline-variant/60 rounded-full hover:bg-sage-wash hover:text-primary transition-colors focus:outline-none cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary tracking-tight">
                Adicionar Novo Dependente
              </h2>
            </div>
          </div>

          <div className="bg-lab-white border border-outline-variant/40 rounded-xl p-6 shadow-sm">
            <p className="font-sans text-xs text-scientific-gray mb-6 leading-relaxed">
              Crie um perfil para um membro da sua família. Você (Master) gerenciará as configurações nutricionais deste perfil.
            </p>

            <form onSubmit={handleAddDependent} className="space-y-4">
              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider font-sans">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={newDependentName}
                  onChange={(e) => setNewDependentName(e.target.value)}
                  placeholder="Ex: Maria Eduarda"
                  className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-lg outline-none font-sans text-xs text-primary"
                />
              </div>

              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider font-sans">
                  Email
                </label>
                <input
                  type="email"
                  value={newDependentEmail}
                  onChange={(e) => setNewDependentEmail(e.target.value)}
                  placeholder="Ex: maria.eduarda@email.com (Opcional)"
                  className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-lg outline-none font-sans text-xs text-primary"
                />
              </div>

              <div>
                <label className="block text-scientific-gray font-semibold mb-1 text-[10px] uppercase tracking-wider font-sans">
                  Grau de Parentesco
                </label>
                <select
                  required
                  value={newDependentRelationship}
                  onChange={(e) => setNewDependentRelationship(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-outline-variant/50 rounded-lg outline-none font-sans text-xs text-primary"
                >
                  <option value="">Selecione...</option>
                  <option value="Esposa">Esposa</option>
                  <option value="Marido">Marido</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Avô/Avó">Avô/Avó</option>
                  <option value="Amigo(a)">Amigo(a)</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-scientific-gray font-semibold mb-1.5 text-[10px] uppercase tracking-wider font-sans">
                  Função Familiar
                </label>
                <select
                  value={newDependentRole}
                  onChange={(e) => setNewDependentRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-outline-variant/50 rounded-lg outline-none font-sans text-xs text-primary"
                >
                  <option value="Dependente">Dependente (Padrao)</option>
                  <option value="Membro">Membro da Família</option>
                  <option value="Cuidador">Cuidador</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 bg-primary text-white font-sans text-xs font-bold py-3 rounded-lg hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-primary-fixed" />
                  )}
                  <span>{isAdding ? "Adicionando..." : "Criar Dependente"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="px-5 py-3 border border-outline-variant/50 text-primary font-sans text-xs rounded-lg hover:bg-sage-wash/50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
