import { LayoutDashboard, Calendar, BookOpen, ShoppingCart, Users, History } from "lucide-react";
import { ActiveView } from "../types";

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { view: ActiveView.DASHBOARD, label: "Painel", icon: LayoutDashboard },
    { view: ActiveView.PLANNER, label: "Cardápio", icon: Calendar },
    { view: ActiveView.RECIPES, label: "Receitas", icon: BookOpen },
    { view: ActiveView.SHOPPING, label: "Compras", icon: ShoppingCart },
    { view: ActiveView.FAMILY, label: "Família", icon: Users },
    { view: ActiveView.HISTORY, label: "Histórico", icon: History }
  ];

  return (
    <aside className="hidden lg:flex flex-col h-[calc(100vh-4rem)] fixed left-0 top-16 w-64 bg-white/70 backdrop-blur-xl border-r border-outline-variant/30 z-30 p-6">
      <div className="mb-6">
        <h3 className="font-serif text-sm font-semibold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2">
          Laboratório
        </h3>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 font-sans text-sm text-left ${
                isActive
                  ? "bg-primary text-white font-bold shadow-md shadow-primary-container/10"
                  : "text-on-surface-variant hover:bg-sage-wash/60 hover:text-primary"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-fixed" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer credit */}
      <div className="mt-auto pt-6 border-t border-outline-variant/20 flex flex-col gap-1 text-[10px] text-scientific-gray">
        <span>Alchemist Web v4.2</span>
        <span>Módulo TACO Otimizado</span>
      </div>
    </aside>
  );
}
