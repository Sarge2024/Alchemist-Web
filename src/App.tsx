import { useState, useEffect } from "react";
import { ActiveView, Profile } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./components/Dashboard";
import WeeklyPlanner from "./components/WeeklyPlanner";
import RecipeList from "./components/RecipeList";
import ShoppingList from "./components/ShoppingList";
import FamilySection from "./components/FamilySection";
import ConsumptionHistory from "./components/ConsumptionHistory";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { userService } from "./services/userService";

interface AppProps {
  initialProfiles?: Profile[];
  familyId?: string;
}

export default function App({ initialProfiles, familyId }: AppProps) {
  // Navigation active view
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.DASHBOARD);
  
  // Custom Toast notification states
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Loaded profiles (usa o real vindo do login ou fallback pro mock visual)
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles || [
    {
      id: "p-elena",
      name: "Elena Vance",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuACcLGGqMxcGvL0Jz7s8y_GpmYpNHb4AZQK5P8wPVOZWES5hZF3GimqZ72psyQ2GYYB2GGp6wQ2zm7Wm_LMXZfOq-XO8gWf8pNQ-YL04uepejFgxu-EoAZq-lg_DQcBqF_Xm065_CG5j86iKS_nzG67BFxbXHZ-TYVLbdOJzY61sMYQ-T8JxE6g7mPBjEm5otkkYXjCFyOlyhQQbfL1_fnwxu5RIdVQsCMJSFJc33mBPotWis7EHUopg9Grce_0y0ri4fxFWo-tK7ix",
      role: "Membro Principal",
      isMainAccount: true,
      dietaryProtocol: ["Vegano", "Sem Lactose"],
      mainMetric: "120g Meta de Proteína",
      metricValue: 120,
      metricLabel: "Proteína",
      progressPercentage: 87,
      email: "elena.vance@molecular-lab.org",
      interfaceLanguage: "pt-BR",
      timezone: "America/Sao_Paulo",
      measurementSystem: "metric",
      dailyCalories: 2200,
      proteinPercentage: 30,
      carbsPercentage: 45,
      fatPercentage: 25,
      allergies: ["Amendoim"],
      medications: "Suplementação de vitamina D3 2000 UI e Zinco Quelato antes do repouso.",
    }
  ]);

  const [activeProfileId, setActiveProfileId] = useState<string>(
    initialProfiles && initialProfiles.length > 0 ? initialProfiles[0].id : "p-elena"
  );
  const [notificationCount, setNotificationCount] = useState<number>(1);

  const currentProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  // Sincroniza atualizações de perfil com o estado local apenas (banco de dados é tratado pelo próprio componente)
  const handleProfilesChange = (newProfiles: Profile[]) => {
    setProfiles(newProfiles);
  };

  // Navigate to profile settings on avatar click
  const handleAvatarClick = () => {
    setActiveView(ActiveView.FAMILY);
  };

  const handleNotificationClick = () => {
    setNotificationCount(0);
    setActiveView(ActiveView.DASHBOARD);
    triggerGlobalToast("Elena R. enviou uma solicitação de entrada familiar.");
  };

  const triggerGlobalToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => {
      setGlobalToast(null);
    }, 4000);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case ActiveView.DASHBOARD:
        return (
          <Dashboard
            currentProfile={currentProfile}
            onNavigateToView={(view) => setActiveView(view)}
            familyId={familyId}
            activeProfileId={activeProfileId}
          />
        );
      case ActiveView.PLANNER:
        return (
          <WeeklyPlanner 
            familyId={familyId}
            activeProfileId={activeProfileId}
          />
        );
      case ActiveView.RECIPES:
        return (
          <RecipeList 
            familyId={familyId || null} 
            activeProfileId={activeProfileId} 
          />
        );
      case ActiveView.SHOPPING:
        return (
          <ShoppingList 
            familyId={familyId}
          />
        );
      case ActiveView.FAMILY:
        return (
          <FamilySection
            profiles={profiles}
            onProfilesChange={handleProfilesChange}
            activeProfileId={activeProfileId}
            onSelectActiveProfile={setActiveProfileId}
            familyId={familyId}
          />
        );
      case ActiveView.HISTORY:
        return (
          <ConsumptionHistory 
            familyId={familyId}
            activeProfileId={activeProfileId}
          />
        );
      default:
        return <Dashboard currentProfile={currentProfile} onNavigateToView={setActiveView} familyId={familyId} activeProfileId={activeProfileId} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-primary font-sans antialiased flex flex-col selection:bg-primary/10">
      {/* Unified Global Header */}
      <Header
        currentProfile={currentProfile}
        onAvatarClick={handleAvatarClick}
        activeView={activeView}
        notificationCount={notificationCount}
        onNotificationClick={handleNotificationClick}
        onTitleClick={() => setActiveView(ActiveView.DASHBOARD)}
      />

      {/* Global Toast Banner */}
      <AnimatePresence>
        {globalToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            className="fixed top-20 left-1/2 z-50 bg-primary text-white px-5 py-3 rounded-full shadow-lg border border-primary-fixed/20 flex items-center gap-2.5 font-sans text-xs font-semibold"
          >
            <Check className="w-4 h-4 text-primary-fixed" />
            <span>{globalToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main app grid structure */}
      <div className="flex-1 flex pt-16">
        {/* Desktop Sidebar Navigation */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Content canvas viewport */}
        <main className="flex-1 lg:pl-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-24 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
