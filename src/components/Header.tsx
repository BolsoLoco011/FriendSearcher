import React from 'react';
import { Compass, UserPlus, Sparkles, MessageSquare, Compass as ExploreIcon, Cloud, User as UserIcon, Database, ShieldAlert, ShieldCheck } from 'lucide-react';
import { User } from '../firebase';
import { isUserAdmin } from '../config/admin';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onOpenDbManager?: () => void;
  currentUser: User | null;
  connectionsCount: number;
  totalFriends: number;
  isSyncing?: boolean;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenAuthModal,
  onOpenDbManager,
  currentUser,
  connectionsCount,
  totalFriends,
  isSyncing = false,
  isAdmin: isAdminProp,
}) => {
  const isAdmin = isAdminProp !== undefined ? isAdminProp : isUserAdmin(currentUser?.email);

  return (
    <header className="relative w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Cápsula Celeste FriendSearcher + Navigation */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
          <div
            id="friendsearcher-title-capsule"
            className="inline-flex items-center gap-2.5 bg-sky-500 px-7 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-lg shadow-sky-200 hover:shadow-sky-300/80 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
            <h1 className="text-white font-bold text-lg sm:text-xl tracking-tight leading-none">
              FriendSearcher
            </h1>
          </div>

          <span className="hidden lg:inline text-slate-300 font-normal">|</span>

          <nav className="flex items-center space-x-3 sm:space-x-5 text-sm font-semibold text-slate-500">
            <span className="text-sky-600 hidden sm:flex items-center gap-1.5 cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              Explorar
            </span>
            {isAdmin && onOpenDbManager && (
              <button 
                id="btn-admin-database"
                onClick={onOpenDbManager}
                className="text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                title="Panel de exploración de base de datos Firestore y administración de usuarios"
              >
                <Database className="w-3.5 h-3.5 text-amber-700" />
                <span>Explorar BD Firestore</span>
                <span className="bg-amber-300 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Admin
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Right actions: Cloud sync, Connections badge, Create button, User avatar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-full px-3.5 py-1.5 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-sky-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span>
              <strong className="text-slate-800">{connectionsCount}</strong> conectadas de <strong className="text-slate-800">{totalFriends}</strong>
            </span>
          </div>

          <button
            id="create-hangout-btn"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Nuevo Plan / Perfil</span>
            <span className="sm:hidden">Crear</span>
          </button>

          {/* User Account / Sign in button */}
          <button
            id="header-user-account-btn"
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100/80 text-sky-800 border border-sky-200 font-semibold text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
            title="Cuenta y base de datos"
          >
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-sky-300"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
            )}
            <span className="hidden md:inline max-w-[90px] truncate">
              {currentUser?.displayName?.split(' ')[0] || (currentUser ? 'Mi Cuenta' : 'Entrar')}
            </span>
            {isAdmin && (
              <span className="hidden lg:inline-flex items-center gap-1 bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                Admin
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
