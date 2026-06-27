import { FlaskConical, Bell, LogOut } from "lucide-react";
import { Profile, ActiveView } from "../types";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

interface HeaderProps {
  currentProfile: Profile;
  onAvatarClick: () => void;
  activeView: ActiveView;
  notificationCount: number;
  onNotificationClick: () => void;
  onTitleClick: () => void;
}

export default function Header({
  currentProfile,
  onAvatarClick,
  activeView,
  notificationCount,
  onNotificationClick,
  onTitleClick
}: HeaderProps) {
  // Translate view names for header breadcrumbs
  const getViewTitle = () => {
    switch (activeView) {
      case ActiveView.DASHBOARD:
        return "Painel de Controle";
      case ActiveView.PLANNER:
        return "Protocolo Semanal";
      case ActiveView.RECIPES:
        return "Gastronomia Molecular";
      case ActiveView.SHOPPING:
        return "Lista de Compras";
      case ActiveView.FAMILY:
        return "Lista da Família";
      case ActiveView.HISTORY:
        return "Histórico de Consumo";
      default:
        return "Alchemist Web";
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-6">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onTitleClick}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary-container/20">
          <FlaskConical className="w-5 h-5 text-primary-fixed" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-lg font-bold text-primary tracking-tight leading-none">
            Alchemist Web
          </span>
          <span className="font-sans text-[10px] uppercase text-scientific-gray tracking-wider font-semibold">
            Nutritional Lab
          </span>
        </div>
      </div>

      {/* Screen Title (Desktop Only) */}
      <div className="hidden md:block font-serif text-md font-semibold text-primary/80">
        {getViewTitle()}
      </div>

      {/* Right controls: Notifications and active avatar */}
      <div className="flex items-center gap-4">
        {/* Notification indicator */}
        <button
          onClick={onNotificationClick}
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-sage-wash hover:text-primary transition-all duration-200"
          title="Notificações"
        >
          <Bell className="w-5 h-5 stroke-[1.75]" />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gold-leaf rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/40" />

        {/* User profile selection trigger */}
        <button
          onClick={onAvatarClick}
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          title="Ver Perfil"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/80 group-hover:border-primary transition-all duration-200 bg-surface">
            <img
              src={currentProfile.avatar}
              alt={currentProfile.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-sans text-xs font-semibold text-primary group-hover:text-gold-leaf transition-colors leading-tight">
              {currentProfile.name}
            </span>
            <span className="font-sans text-[10px] text-scientific-gray leading-none">
              {currentProfile.role}
            </span>
          </div>
        </button>

        {/* Logout Button */}
        {auth && (
          <>
            <div className="hidden sm:block w-px h-6 bg-outline-variant/40" />
            <button
              onClick={() => signOut(auth)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-200 cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-5 h-5 stroke-[1.75]" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
