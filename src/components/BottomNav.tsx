import { LayoutDashboard, Calendar, BookOpen, ShoppingCart, Users, History, Camera } from "lucide-react";
import { ActiveView } from "../types";

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const menuItems = [
    { view: ActiveView.DASHBOARD, label: "Painel", icon: LayoutDashboard },
    { view: ActiveView.RECIPES, label: "Receitas", icon: BookOpen },
    { view: ActiveView.PLANNER, label: "Cardápio", icon: Calendar },
    { view: ActiveView.SHOPPING, label: "Compras", icon: ShoppingCart },
    { view: ActiveView.FAMILY, label: "Família", icon: Users },
    { view: ActiveView.HISTORY, label: "Histórico", icon: History },
    { view: ActiveView.SCANNER, label: "Scanner", icon: Camera }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 px-3 pb-safe pt-2 flex justify-around items-center">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 relative ${
              isActive
                ? "bg-secondary-container text-on-secondary-container scale-95 font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5 stroke-[1.75]" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
