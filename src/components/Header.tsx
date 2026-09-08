import React from 'react';
import { Compass, UserPlus, Sparkles, MessageSquare, Compass as ExploreIcon, Cloud, User as UserIcon, Database, ShieldAlert, ShieldCheck } from 'lucide-react';
import { User } from '../firebase';
import { isUserAdmin } from '../config/admin';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onOpenDbManager?: () => void;
  onOpenCaracteristicas?: () => void;
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
  onOpenCaracteristicas,
  currentUser,
  connectionsCount,
  totalFriends,
  isSyncing = false,
  isAdmin: isAdminProp,
}) => {
  const isAdmin = isAdminProp !== undefined ? isAdminProp : isUserAdmin(currentUser?.email);

  return (
    <header className="relative w-full border-b border-sky-600/60 bg-sky-500 sticky top-0 z-40 shadow-md shadow-sky-600/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Cápsula Celeste FriendSearcher + CARACTERISTICAS + Navigation */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5">
          <div
            id="friendsearcher-title-capsule"
            className="inline-flex items-center gap-2.5 bg-sky-600/90 hover:bg-sky-600 border border-white/25 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
            <h1 className="text-white font-black text-lg sm:text-xl tracking-tight leading-none">
              FriendSearcher
            </h1>
          </div>

          {/* Diga CARACTERISTICAS al lado de FriendSearcher arriba a la izquierda */}
          <button
            id="header-caracteristicas-btn"
            onClick={onOpenCaracteristicas}
            className="inline-flex items-center gap-1.5 bg-sky-600/90 hover:bg-sky-700 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 shadow-sm hover:shadow transition-all cursor-pointer"
            title="Explorar Características y Afinidad"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>CARACTERISTICAS</span>
          </button>

          <span className="hidden lg:inline text-sky-300/60 font-normal">|</span>

          <nav className="flex items-center space-x-3 text-sm font-semibold text-white">
            <span className="text-white flex items-center gap-1.5 cursor-pointer bg-sky-600/70 border border-sky-400/50 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Explorar
            </span>
            {isAdmin && onOpenDbManager && (
              <button 
                id="btn-admin-database"
                onClick={onOpenDbManager}
                className="text-amber-950 bg-amber-300 hover:bg-amber-200 border border-amber-400/80 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold px-3 py-1 rounded-full shadow-xs"
                title="Panel de exploración de base de datos Firestore y administración de usuarios"
              >
                <Database className="w-3.5 h-3.5 text-amber-900" />
                <span>Explorar BD Firestore</span>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Admin
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Right actions: Cloud sync, Connections badge, Create button, User avatar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs text-white bg-sky-600/70 border border-sky-400/60 rounded-full px-3.5 py-1.5 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-white animate-ping' : 'bg-emerald-300 animate-pulse'}`}></span>
            <span>
              <strong className="text-white font-bold">{connectionsCount}</strong> conectadas de <strong className="text-white font-bold">{totalFriends}</strong>
            </span>
          </div>

          <button
            id="create-hangout-btn"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer border border-white/80"
          >
            <UserPlus className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Nuevo Plan / Perfil</span>
            <span className="sm:hidden">Crear</span>
          </button>

          {/* User Account / Sign in button */}
          <button
            id="header-user-account-btn"
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-2 bg-sky-600/80 hover:bg-sky-600 text-white border border-sky-400/60 font-semibold text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
            title="Cuenta y base de datos"
          >
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-white/80"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white text-sky-600 font-bold flex items-center justify-center text-[10px]">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-3 h-3 text-sky-600" />}
              </div>
            )}
            <span className="hidden md:inline max-w-[90px] truncate text-white font-medium">
              {currentUser?.displayName?.split(' ')[0] || (currentUser ? 'Mi Cuenta' : 'Entrar')}
            </span>
            {isAdmin && (
              <span className="hidden lg:inline-flex items-center gap-1 bg-amber-300 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-amber-800" />
                Admin
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
