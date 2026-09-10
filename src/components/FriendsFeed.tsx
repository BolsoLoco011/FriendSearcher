import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Laugh, 
  Utensils, 
  CalendarCheck, 
  Users, 
  MapPin, 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  SlidersHorizontal, 
  Check, 
  Database, 
  Trash2, 
  Loader2,
  Edit3,
  Dumbbell,
  Gamepad2,
  Trophy
} from 'lucide-react';
import { FriendProfile, CategoryKey } from '../types';
import { calculateCompatibility } from '../utils/compatibility';

interface FriendsFeedProps {
  friends: FriendProfile[];
  selectedCategory: CategoryKey | 'all';
  onSelectCategory: (cat: CategoryKey | 'all') => void;
  onOpenFriendDetail: (friend: FriendProfile) => void;
  onToggleConnect: (id: string) => void;
  activeTraitFilter: string | null;
  onClearTraitFilter: () => void;
  isLoading?: boolean;
  onDeleteFriend?: (id: string) => void;
  onOpenDbManager?: () => void;
  currentUserProfile?: FriendProfile | null;
  isAdmin?: boolean;
  onEditFriendInDb?: (friend: FriendProfile) => void;
}

export const FriendsFeed: React.FC<FriendsFeedProps> = ({
  friends,
  selectedCategory,
  onSelectCategory,
  onOpenFriendDetail,
  onToggleConnect,
  activeTraitFilter,
  onClearTraitFilter,
  isLoading = false,
  onDeleteFriend,
  onOpenDbManager,
  currentUserProfile,
  isAdmin = false,
  onEditFriendInDb,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatch, setMinMatch] = useState(55);

  const friendsWithCompatibility = friends.map((friend) => ({
    ...friend,
    dynamicCompatibility: calculateCompatibility(friend, currentUserProfile)
  }));

  const filteredFriends = friendsWithCompatibility.filter((friend) => {
    // Category match
    if (selectedCategory !== 'all' && friend.highlightCategory !== selectedCategory) {
      // Also check if category keywords match
      const catMatch = 
        (selectedCategory === 'caracteristicas' && friend.traits.length > 0) ||
        (selectedCategory === 'deportes' && (
          friend.traits.some(t => {
            const n = t.toLowerCase();
            return n.includes('deporte') || n.includes('fútbol') || n.includes('futbol') || n.includes('básquet') || n.includes('basquet') || n.includes('running') || n.includes('tenis') || n.includes('pádel') || n.includes('padel');
          }) ||
          friend.joinedGroup?.toLowerCase().includes('futbol') ||
          friend.joinedGroup?.toLowerCase().includes('deporte') ||
          friend.joinedEvent?.toLowerCase().includes('futbol')
        )) ||
        (selectedCategory === 'memes' && friend.favoriteMemeStyle) ||
        (selectedCategory === 'cocina' && friend.favoriteFood) ||
        (selectedCategory === 'eventos' && friend.joinedEvent) ||
        (selectedCategory === 'grupos' && friend.joinedGroup) ||
        (selectedCategory === 'gimnasio' && (
          friend.traits.some(t => {
            const n = t.toLowerCase();
            return n.includes('gimnasio') || n.includes('gym') || n.includes('deportes') || n.includes('fitness');
          }) ||
          friend.joinedGroup?.toLowerCase().includes('futbol') ||
          friend.joinedEvent?.toLowerCase().includes('futbol')
        )) ||
        (selectedCategory === 'juegos' && (
          friend.traits.some(t => {
            const n = t.toLowerCase();
            return n.includes('juego') || n.includes('videojuego') || n.includes('gamer') || n.includes('gaming') || n.includes('corona');
          }) ||
          friend.occupation?.toLowerCase().includes('gamer') ||
          friend.joinedGroup?.toLowerCase().includes('gaming') ||
          friend.joinedGroup?.toLowerCase().includes('juegos')
        ));
      if (!catMatch) return false;
    }

    // Trait filter from modal if active
    if (activeTraitFilter) {
      const hasTrait = friend.traits.some(t => t.toLowerCase().includes(activeTraitFilter.toLowerCase()));
      if (!hasTrait) return false;
    }

    // Real dynamic match score filter
    if (friend.dynamicCompatibility.score < minMatch) return false;

    // Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      friend.name.toLowerCase().includes(q) ||
      friend.city.toLowerCase().includes(q) ||
      friend.bio.toLowerCase().includes(q) ||
      friend.traits.some(t => t.toLowerCase().includes(q)) ||
      friend.favoriteFood.toLowerCase().includes(q) ||
      friend.favoriteMemeStyle.toLowerCase().includes(q)
    );
  });

  return (
    <section className="w-full py-4 sm:py-6">
      {/* Live Firestore DB Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 px-3 py-2.5 rounded-2xl bg-sky-50 border border-sky-300 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-600"></span>
          </span>
          <span className="font-bold text-sky-950">Base de Datos:</span>
          <span className="text-sky-900 font-mono text-[11px] bg-sky-200/90 px-2 py-0.5 rounded border border-sky-300">
            Firestore /users ({friends.length} perfiles en la nube)
          </span>
        </div>

        {onOpenDbManager && (
          <button
            onClick={onOpenDbManager}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-200 border border-sky-300 text-sky-950 hover:bg-sky-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-sky-700" />
            <span>Explorar BD Firestore</span>
          </button>
        )}
      </div>

      {/* Search and Discovery Bar */}
      <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Main Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
            <input
              id="search-friends-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar amigos por nombre, ciudad, gustos de cocina, memes, eventos..."
              className="w-full bg-sky-100/70 border border-sky-300 rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-sky-950 placeholder-sky-500 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-sky-600 hover:text-sky-900 font-semibold cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Affinity Threshold Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end px-2">
            <div className="flex items-center gap-2 text-xs text-sky-900">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <span>Afinidad mínima:</span>
              <strong className="text-sky-700 font-bold">{minMatch}%</strong>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
          </div>

        </div>

        {/* Filter Badges for 5 Pillars */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-sky-200">
          <span className="text-xs font-bold text-sky-800 mr-1">Filtro rápido:</span>
          
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            Todos ({friends.length})
          </button>

          <button
            onClick={() => onSelectCategory('caracteristicas')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'caracteristicas'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-sky-600" />
            Características
          </button>

          <button
            onClick={() => onSelectCategory('deportes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'deportes'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Trophy className="w-3 h-3 text-emerald-700" />
            Deportes
          </button>

          <button
            onClick={() => onSelectCategory('memes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'memes'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Laugh className="w-3 h-3 text-sky-600" />
            Memes
          </button>

          <button
            onClick={() => onSelectCategory('cocina')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'cocina'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Utensils className="w-3 h-3 text-sky-600" />
            Cocina
          </button>

          <button
            onClick={() => onSelectCategory('eventos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'eventos'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <CalendarCheck className="w-3 h-3 text-sky-600" />
            Eventos
          </button>

          <button
            onClick={() => onSelectCategory('grupos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'grupos'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Users className="w-3 h-3 text-sky-600" />
            Grupos
          </button>

          <button
            onClick={() => onSelectCategory('gimnasio')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'gimnasio'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Dumbbell className="w-3 h-3 text-sky-600" />
            Gimnasio
          </button>

          <button
            onClick={() => onSelectCategory('juegos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'juegos'
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'bg-sky-200/80 text-sky-900 hover:bg-sky-300 border border-sky-300'
            }`}
          >
            <Gamepad2 className="w-3 h-3 text-violet-700" />
            Juegos
          </button>

          {activeTraitFilter && (
            <div className="ml-auto flex items-center gap-2 bg-sky-200 border border-sky-400 text-sky-950 px-3 py-1 rounded-full text-xs font-bold">
              <span>Rasgo: {activeTraitFilter}</span>
              <button onClick={onClearTraitFilter} className="hover:text-sky-700 cursor-pointer">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state from Firestore */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-2xs">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Cargando perfiles desde Firestore...</h3>
          <p className="text-xs text-slate-500">
            Consultando la colección en tiempo real.
          </p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No se encontraron perfiles</h3>
          <p className="text-xs text-slate-500 mb-4">
            Intenta reducir la afinidad mínima o borrar los términos de búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setMinMatch(70);
              onSelectCategory('all');
              if (activeTraitFilter) onClearTraitFilter();
            }}
            className="px-4 py-2 bg-sky-500 text-white text-xs font-semibold rounded-full hover:bg-sky-600 transition-all cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              id={`friend-card-${friend.id}`}
              className="bg-sky-50 border border-sky-300 hover:border-sky-500 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Friend Card Top Banner / Avatar */}
                <div className="relative p-5 pb-0 flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-300 group-hover:border-sky-500 transition-colors shadow-2xs bg-slate-900"
                    />
                    <span 
                      className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold shadow-xs bg-sky-600"
                      title={`Compatibilidad real: ${friend.dynamicCompatibility.score}% (${friend.dynamicCompatibility.affinityLevel})`}
                    >
                      {friend.dynamicCompatibility.score}%
                    </span>
                    {(friend.id === 'f-1' || friend.secondaryAvatar || friend.name.toLowerCase().includes('benja')) && (
                      <span 
                        className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-950 text-white shadow-xs border border-sky-300 flex items-center gap-0.5"
                        title="Tiene 2 fotos de perfil: Corona Chalk y Gatito"
                      >
                        📸 2 fotos
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-bold text-sky-950 truncate group-hover:text-sky-600 transition-colors">
                        {friend.name}, <span className="font-normal text-sky-700 text-xs">{friend.age}</span>
                      </h3>
                      <span className="text-[10px] font-mono text-sky-800 bg-sky-200/80 px-1.5 py-0.5 rounded border border-sky-300">
                        id: {friend.id}
                      </span>
                    </div>
                    <p className="text-xs text-sky-800 truncate font-medium">{friend.occupation}</p>
                    <p className="text-[11px] text-sky-700 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {friend.city}
                    </p>
                    {friend.dynamicCompatibility.reasons.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-950 bg-sky-200/70 px-2 py-0.5 rounded-md border border-sky-300 truncate">
                        <Sparkles className="w-3 h-3 text-sky-600 shrink-0" />
                        <span className="truncate font-medium">{friend.dynamicCompatibility.reasons[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="px-5 py-3">
                  <p className="text-xs text-sky-900 line-clamp-2 leading-relaxed">
                    {friend.bio}
                  </p>

                  {/* Traits pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {friend.traits.slice(0, 3).map((trait) => (
                      <span
                        key={trait}
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-200/90 text-sky-950 border border-sky-300"
                      >
                        #{trait}
                      </span>
                    ))}
                    {friend.traits.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] text-sky-900 font-bold bg-sky-300/80 border border-sky-400">
                        +{friend.traits.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Highlighting 2 Pillars */}
                  <div className="mt-3.5 pt-3 border-t border-sky-200 space-y-1.5 text-[11px] bg-sky-100/80 p-2.5 rounded-xl border border-sky-300">
                    <div className="flex items-center justify-between gap-1.5 text-sky-900">
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <Utensils className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span className="text-sky-700 font-semibold">Cocina:</span>
                        <span className="truncate text-sky-950 font-bold">{friend.favoriteFood}</span>
                      </div>
                      {isAdmin && onEditFriendInDb && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditFriendInDb(friend); }}
                          className="p-1 rounded-md text-sky-700 hover:text-sky-950 hover:bg-sky-200 transition-colors cursor-pointer shrink-0"
                          title="Modificar comida favorita y datos en Firestore"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sky-900 truncate">
                      <Laugh className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <span className="text-sky-700 font-semibold">Humor:</span>
                      <span className="truncate text-sky-950 font-medium">{friend.favoriteMemeStyle}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-3 border-t border-sky-200 bg-sky-100/60 flex items-center gap-2">
                <button
                  onClick={() => onToggleConnect(friend.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    friend.isConnected
                      ? 'bg-sky-200 text-sky-950 border border-sky-400'
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-2xs'
                  }`}
                >
                  {friend.isConnected ? <UserCheck className="w-3.5 h-3.5 text-sky-700" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{friend.isConnected ? 'Conectado' : 'Conectar'}</span>
                </button>

                <button
                  onClick={() => onOpenFriendDetail(friend)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-sky-200 hover:bg-sky-300 text-sky-950 border border-sky-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-700" />
                  <span>Chat</span>
                </button>

                {isAdmin && onEditFriendInDb && (
                  <button
                    onClick={() => onEditFriendInDb(friend)}
                    title="Modificar datos del usuario en Firestore (favoriteFood, etc.)"
                    className="py-2 px-2.5 rounded-xl text-xs font-bold bg-sky-300/80 hover:bg-sky-300 text-sky-950 border border-sky-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-800" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                )}

                {onDeleteFriend && (
                  <button
                    onClick={() => onDeleteFriend(friend.id)}
                    title="Eliminar de Firestore"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </section>
  );
};
