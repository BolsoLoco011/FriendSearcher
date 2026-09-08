import React, { useState } from 'react';
import { 
  X, Sparkles, Laugh, Utensils, CalendarCheck, Users, Heart, Check, Plus, 
  MapPin, Clock, MessageSquare, ThumbsUp, Trophy, Music, Dumbbell, Gamepad2, 
  Trees, Laptop, ArrowRight, UserPlus, UserCheck 
} from 'lucide-react';
import { CategoryCardInfo, CategoryKey, MemeItem, CookingItem, EventItem, GroupItem, FriendProfile, GymItem } from '../types';
import { calculateCompatibility } from '../utils/compatibility';
import { GamesSection } from './GamesSection';

interface CategoryDetailModalProps {
  category: CategoryCardInfo | null;
  onClose: () => void;
  memes: MemeItem[];
  cooking: CookingItem[];
  events: EventItem[];
  groups: GroupItem[];
  gym?: GymItem[];
  friends?: FriendProfile[];
  onOpenFriendDetail?: (friend: FriendProfile) => void;
  onToggleConnect?: (id: string) => void;
  onToggleMemeVote: (id: string) => void;
  onToggleEventJoin: (id: string) => void;
  onToggleGroupJoin: (id: string) => void;
  onToggleGymJoin?: (id: string) => void;
  onSelectTraitFilter?: (trait: string) => void;
  currentUserProfile?: FriendProfile | null;
}

export const MAIN_CHARACTERISTICS = [
  { id: 'DEPORTES', label: 'DEPORTES', icon: Trophy, color: 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-400' },
  { id: 'MUSICA', label: 'MUSICA', icon: Music, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-400' },
  { id: 'GIMNASIO', label: 'GIMNASIO', icon: Dumbbell, color: 'text-rose-600 bg-rose-50 border-rose-200 hover:border-rose-400' },
  { id: 'VIDEOJUEGOS', label: 'VIDEOJUEGOS', icon: Gamepad2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
  { id: 'NATURALEZA', label: 'NATURALEZA', icon: Trees, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400' },
  { id: 'INFORMATICA', label: 'INFORMATICA', icon: Laptop, color: 'text-cyan-600 bg-cyan-50 border-cyan-200 hover:border-cyan-400' },
  { id: 'MEMES', label: 'MEMES', icon: Laugh, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400' },
];

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  category,
  onClose,
  memes,
  cooking,
  events,
  groups,
  gym = [],
  friends = [],
  onOpenFriendDetail,
  onToggleConnect,
  onToggleMemeVote,
  onToggleEventJoin,
  onToggleGroupJoin,
  onToggleGymJoin,
  onSelectTraitFilter,
  currentUserProfile,
}) => {
  if (!category) return null;

  const [selectedTrait, setSelectedTrait] = useState<string>('DEPORTES');
  const [cookingRsvp, setCookingRsvp] = useState<Record<string, boolean>>({});

  const handleToggleCookingRsvp = (id: string) => {
    setCookingRsvp(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className={`relative w-full ${category.key === 'juegos' ? 'max-w-5xl' : 'max-w-4xl'} bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 4K Banner */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={category.image}
            alt={category.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/80 transition-all z-20 shadow-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>



          {/* Category Title Overlay */}
          <div className="absolute bottom-4 left-4 sm:left-6 z-10 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              {category.subtitle}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {category.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mt-1 line-clamp-2">
              {category.description}
            </p>
          </div>
        </div>

        {/* Modal Body: Content by Category */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-6">

          {/* 1. CARACTERÍSTICAS */}
          {category.key === 'caracteristicas' && (() => {
            const normalize = (str: string) =>
              str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            const matchingFriends = friends.filter(friend => {
              if (!selectedTrait) return true;
              const target = normalize(selectedTrait);
              return friend.traits.some(t => {
                const normT = normalize(t);
                return normT === target || normT.includes(target) || target.includes(normT);
              });
            });

            return (
              <div className="space-y-6">
                {/* 7 Core Characteristics Navigation Bar */}
                <div className="bg-slate-50 border border-slate-200/90 p-4 sm:p-5 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-500" />
                        Radar de Características & Afinidad
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selecciona una característica para descubrir qué amigos comparten tu pasión:
                      </p>
                    </div>

                    {selectedTrait && onSelectTraitFilter && (
                      <button
                        onClick={() => {
                          onSelectTraitFilter(selectedTrait);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex-shrink-0"
                      >
                        <span>Filtrar en Muro</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* The 7 requested characteristics in clear uppercase row/grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                    {MAIN_CHARACTERISTICS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedTrait === item.id;
                      const count = friends.filter(f => 
                        f.traits.some(t => {
                          const nT = normalize(t);
                          const nTarget = normalize(item.id);
                          return nT === nTarget || nT.includes(nTarget) || nTarget.includes(nT);
                        })
                      ).length;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTrait(item.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-[1.02]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : item.color.split(' ')[0]}`} />
                          <span className="text-xs font-black tracking-wider">
                            {item.label}
                          </span>
                          <span className={`text-[10px] mt-1 font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {count} {count === 1 ? 'amigo' : 'amigos'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Friends List for the Selected Characteristic */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>Amigos con la característica:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold text-xs">
                        {selectedTrait}
                      </span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      {matchingFriends.length} {matchingFriends.length === 1 ? 'perfil coincidente' : 'perfiles coincidentes'}
                    </span>
                  </div>

                  {matchingFriends.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                      <p className="text-xs text-slate-500">
                        No hay perfiles activos con la característica {selectedTrait} aún.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matchingFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 hover:border-sky-300 hover:shadow-sm transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              {(() => {
                                const comp = calculateCompatibility(friend, currentUserProfile);
                                return (
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-900 truncate">
                                      {friend.name}, {friend.age}
                                    </h5>
                                    <span 
                                      className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${
                                        comp.score >= 90
                                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : comp.score >= 75
                                          ? 'text-sky-700 bg-sky-50 border-sky-200'
                                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                                      }`}
                                      title={`Compatibilidad dinámica: ${comp.score}% (${comp.affinityLevel})`}
                                    >
                                      {comp.score}%
                                    </span>
                                  </div>
                                );
                              })()}
                              <p className="text-[11px] text-slate-500 truncate">
                                {friend.city} • {friend.occupation}
                              </p>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-snug">
                                {friend.bio}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1 max-w-[60%]">
                              {friend.traits.slice(0, 3).map((t, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                    normalize(t) === normalize(selectedTrait)
                                      ? 'bg-sky-500 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {onToggleConnect && (
                                <button
                                  onClick={() => onToggleConnect(friend.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    friend.isConnected
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                                  }`}
                                >
                                  {friend.isConnected ? (
                                    <>
                                      <UserCheck className="w-3 h-3 text-emerald-600" />
                                      <span>Conectado</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-3 h-3" />
                                      <span>Conectar</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {onOpenFriendDetail && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onOpenFriendDetail(friend);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                >
                                  Ver Perfil
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compatibility Stats Footnote */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl text-center shadow-2xs">
                    <span className="text-xl font-black text-sky-600">7 Pilares</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Deportes, Música, Gym, Juegos...</p>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl text-center shadow-2xs">
                    <span className="text-xl font-black text-emerald-600">98% Match</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Máxima afinidad alcanzable</p>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl text-center shadow-2xs">
                    <span className="text-xl font-black text-slate-800">100% Real</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Perfiles verificados en 4K</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. MEMES */}
          {category.key === 'memes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Laugh className="w-4 h-4 text-amber-500" />
                  Muro de Memes 4K (Vota y descubre afinidad de humor)
                </h3>
                <span className="text-xs text-slate-500">{memes.length} memes virales</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {memes.map(meme => (
                  <div key={meme.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-2xs">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain bg-white hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 text-slate-800 text-[10px] font-bold border border-slate-200/80 shadow-xs">
                        {meme.tag}
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                        "{meme.title}"
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Publicado por <strong className="text-slate-700">{meme.sharedByFriend}</strong></span>
                        <button
                          onClick={() => onToggleMemeVote(meme.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            meme.userVoted
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${meme.userVoted ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{meme.likes + (meme.userVoted ? 1 : 0)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. COCINA */}
          {category.key === 'cocina' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  Quedadas Gastronómicas & Cocina Colaborativa
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cooking.map(item => {
                  const isRsvp = cookingRsvp[item.id];
                  return (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-2xs">
                      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-xs">
                          {item.cuisine}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {item.nextGathering} • Host: {item.hostName}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Nivel: <span className="text-slate-700 font-medium">{item.level}</span>
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {item.membersInterested + (isRsvp ? 1 : 0)} apuntados
                          </span>
                          <button
                            onClick={() => handleToggleCookingRsvp(item.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isRsvp
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-slate-200'
                            }`}
                          >
                            {isRsvp ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isRsvp ? 'Apuntado/a' : 'Quiero ir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. EVENTOS */}
          {category.key === 'eventos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-fuchsia-600" />
                  Próximos Eventos & Salidas Grupales
                </h3>
              </div>

              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-wider">
                          {ev.categoryTag}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-800">{ev.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-fuchsia-600" />
                            {ev.date} - {ev.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {ev.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-slate-500">
                        {ev.attendees + (ev.isJoined ? 1 : 0)} asistiendo
                      </span>
                      <button
                        onClick={() => onToggleEventJoin(ev.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          ev.isJoined
                            ? 'bg-fuchsia-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-fuchsia-600 hover:text-white text-fuchsia-700 border border-slate-200'
                        }`}
                      >
                        {ev.isJoined ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {ev.isJoined ? 'Asistiré' : 'Asistir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. GRUPOS */}
          {category.key === 'grupos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Comunidades & Squads Temáticos
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map(grp => (
                  <div key={grp.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-3">
                        <img
                          src={grp.imageUrl}
                          alt={grp.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{grp.name}</h4>
                          <span className="text-[11px] text-sky-600 font-medium">
                            {grp.members + (grp.isJoined ? 1 : 0)} miembros • {grp.activityLevel}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">
                        {grp.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {grp.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => onToggleGroupJoin(grp.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          grp.isJoined
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 hover:bg-sky-500 hover:text-white text-sky-700 border border-slate-200'
                        }`}
                      >
                        {grp.isJoined ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {grp.isJoined ? 'Miembro' : 'Unirme'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. GIMNASIO & FITNESS */}
          {category.key === 'gimnasio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-rose-500" />
                    Entrenamientos, Rutinas & Gym Buddies
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conecta con personas que entrenan en tu zona para compartir series, rutinas y superarse juntos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {gym.length} Rutinas activas
                  </span>
                </div>
              </div>

              {/* Gym Sessions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gym.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-36 rounded-xl overflow-hidden mb-3">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 text-rose-400" />
                          <span>{item.activity}</span>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{item.membersCount} personas</span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mb-1 leading-snug">
                        {item.title}
                      </h4>
                      {item.notes && (
                        <p className="text-xs text-slate-600 mb-2.5 line-clamp-2">
                          {item.notes}
                        </p>
                      )}

                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{item.schedule}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="font-medium">Organiza:</span>
                          <span className="text-slate-700 font-semibold">{item.hostName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {item.isJoined ? '¡Estás anotado!' : 'Sumate al entrenamiento'}
                      </span>
                      <button
                        onClick={() => onToggleGymJoin && onToggleGymJoin(item.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          item.isJoined
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.isJoined ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {item.isJoined ? 'Gym Buddy' : 'Entrenar juntos'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matching Friends who like gym */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Amigos con afinidad a Gimnasio & Fitness ({
                    friends.filter(f => f.traits.some(t => {
                      const norm = t.toLowerCase();
                      return norm.includes('gimnasio') || norm.includes('gym') || norm.includes('deportes') || norm.includes('fitness');
                    })).length
                  })</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends
                    .filter(f => f.traits.some(t => {
                      const norm = t.toLowerCase();
                      return norm.includes('gimnasio') || norm.includes('gym') || norm.includes('deportes') || norm.includes('fitness');
                    }))
                    .map((friend) => {
                      const comp = calculateCompatibility(friend, currentUserProfile);
                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition-all cursor-pointer"
                          onClick={() => onOpenFriendDetail && onOpenFriendDetail(friend)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{friend.name}, {friend.age}</p>
                              <p className="text-[11px] text-slate-500">{friend.city} • {comp.score}% Afinidad</p>
                            </div>
                          </div>
                          {onToggleConnect && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleConnect(friend.id);
                              }}
                              className={`p-2 rounded-full border text-xs transition-all cursor-pointer ${
                                friend.isConnected
                                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                                  : 'bg-slate-100 hover:bg-rose-50 border-slate-200 text-slate-700 hover:text-rose-600'
                              }`}
                            >
                              {friend.isConnected ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 6. JUEGOS & MINIVIDEOJUEGOS (TA TE TI) */}
          {category.key === 'juegos' && (
            <GamesSection
              friends={friends}
              onOpenFriendDetail={onOpenFriendDetail}
              currentUserProfile={currentUserProfile}
            />
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            Módulo 4K HD interactivo sincronizado
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
