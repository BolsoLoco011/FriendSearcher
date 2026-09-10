import React, { useState } from 'react';
import { 
  X, Sparkles, Laugh, Utensils, CalendarCheck, Users, Heart, Check, Plus, 
  MapPin, Clock, MessageSquare, ThumbsUp, Trophy, Music, Dumbbell, Gamepad2, 
  Trees, Laptop, ArrowRight, UserPlus, UserCheck, Flame, Swords, Shield, Star
} from 'lucide-react';
import { CategoryCardInfo, CategoryKey, MemeItem, CookingItem, EventItem, GroupItem, FriendProfile, GymItem, SportItem } from '../types';
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
  sports?: SportItem[];
  friends?: FriendProfile[];
  onOpenFriendDetail?: (friend: FriendProfile) => void;
  onToggleConnect?: (id: string) => void;
  onToggleMemeVote: (id: string) => void;
  onToggleEventJoin: (id: string) => void;
  onToggleGroupJoin: (id: string) => void;
  onToggleGymJoin?: (id: string) => void;
  onToggleSportJoin?: (id: string) => void;
  onVoteClasico?: (team: 'barca' | 'madrid' | 'draw') => void;
  onVoteChampions?: (team: 'psg' | 'bayern' | 'draw') => void;
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
  sports = [],
  friends = [],
  onOpenFriendDetail,
  onToggleConnect,
  onToggleMemeVote,
  onToggleEventJoin,
  onToggleGroupJoin,
  onToggleGymJoin,
  onToggleSportJoin,
  onVoteClasico,
  onVoteChampions,
  onSelectTraitFilter,
  currentUserProfile,
}) => {
  if (!category) return null;

  const [selectedTrait, setSelectedTrait] = useState<string>('DEPORTES');
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('todos');
  const [cookingRsvp, setCookingRsvp] = useState<Record<string, boolean>>({});
  const [clasicoBanterMessage, setClasicoBanterMessage] = useState<string | null>(null);
  const [championsBanterMessage, setChampionsBanterMessage] = useState<string | null>(null);

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

          {/* DEPORTES & FÚTBOL */}
          {category.key === 'deportes' && (() => {
            const clasicoItem = sports.find(s => s.id === 'sport-clasico' || s.isClasico) || sports[0];
            const barcaVotes = clasicoItem?.clasicoData?.barcaVotes ?? 142;
            const madridVotes = clasicoItem?.clasicoData?.madridVotes ?? 138;
            const drawVotes = clasicoItem?.clasicoData?.drawVotes ?? 24;
            const totalVotes = Math.max(1, barcaVotes + madridVotes + drawVotes);
            const barcaPct = Math.round((barcaVotes / totalVotes) * 100);
            const madridPct = Math.round((madridVotes / totalVotes) * 100);
            const drawPct = Math.max(0, 100 - barcaPct - madridPct);
            const userVote = clasicoItem?.clasicoData?.userVote;

            const championsItem = sports.find(s => s.id === 'sport-champions' || s.isChampions);
            const psgVotes = championsItem?.championsData?.psgVotes ?? 132;
            const bayernVotes = championsItem?.championsData?.bayernVotes ?? 139;
            const champDrawVotes = championsItem?.championsData?.drawVotes ?? 21;
            const totalChampVotes = Math.max(1, psgVotes + bayernVotes + champDrawVotes);
            const psgPct = Math.round((psgVotes / totalChampVotes) * 100);
            const bayernPct = Math.round((bayernVotes / totalChampVotes) * 100);
            const champDrawPct = Math.max(0, 100 - psgPct - bayernPct);
            const userChampVote = championsItem?.championsData?.userVote;

            const filteredSports = sports.filter(s => {
              if (selectedSportFilter === 'todos') return true;
              if (selectedSportFilter === 'champions') return s.isChampions || s.id === 'sport-champions' || s.sport.toLowerCase().includes('champions');
              if (selectedSportFilter === 'clásico') return s.isClasico || s.id === 'sport-clasico' || s.sport.toLowerCase().includes('clásico');
              return s.sport.toLowerCase().includes(selectedSportFilter.toLowerCase());
            });

            const sportsFriends = friends.filter(f => f.traits.some(t => {
              const norm = t.toLowerCase();
              return norm.includes('deporte') || norm.includes('fútbol') || norm.includes('futbol') || norm.includes('básquet') || norm.includes('padel') || norm.includes('pádel') || norm.includes('running');
            }));

            return (
              <div className="space-y-6">
                {/* Sports Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-5 sm:p-6 text-white shadow-md">
                  <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full overflow-hidden opacity-25 pointer-events-none">
                    <img
                      src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80"
                      alt="Pelota de fútbol"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-200 text-xs font-bold mb-2">
                      <span className="text-base">⚽</span>
                      <span>Encuentros Deportivos, Champions League & El Clásico</span>
                      <span>•</span>
                      <span className="text-white">{sports.length} Partidos & Eventos</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Partidos, Torneos & ¡Superclásicos Mundiales!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
                      Conecta con amigos para vivir la Champions League (PSG vs Bayern Múnich), El Clásico (Barça vs Real Madrid), jugar al fútbol 5 y 7 o armar torneos de pádel.
                    </p>
                  </div>
                </div>

                {/* 2 Superpartidos Destacados Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/70 shadow-xl">
                  <div className="flex items-center gap-2.5 px-1">
                    <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-black text-white">¡LOS 2 SÚPER PARTIDAZOS MUNDIALES EN VIVO!</h4>
                      <p className="text-[11px] text-slate-300">Ambos partidos disponibles con escudos oficiales, votación en vivo, prode y juntada</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href="#partido-clasico"
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 border border-amber-400 text-amber-300 hover:brightness-125 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <img src="/barca.svg" alt="Barça" className="w-4 h-4 object-contain" />
                      <span>El Clásico</span>
                      <img src="/real-madrid.svg" alt="Madrid" className="w-4 h-4 object-contain" />
                    </a>
                    <a
                      href="#partido-champions"
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#03153c] via-slate-900 to-[#4a0d17] border border-cyan-400 text-cyan-300 hover:brightness-125 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <img src="/psg.svg" alt="PSG" className="w-4 h-4 object-contain" />
                      <span>Champions League</span>
                      <img src="/bayern.svg" alt="Bayern" className="w-4 h-4 object-contain" />
                    </a>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 🏆 ¡¡¡PSG VS BAYERN MUNICH POR CHAMPIONS LEAGUE!!!!!!!!!!! */}
                {/* ======================================================== */}
                <div id="partido-champions" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020b22] via-[#08153c] to-[#1a0512] border-2 border-cyan-400/90 p-5 sm:p-7 text-white shadow-2xl">
                    {/* Decorative ambient lighting */}
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Header Badges */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-xs shadow-lg tracking-wider">
                        <Star className="w-4 h-4 text-cyan-200 fill-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>¡¡¡UEFA CHAMPIONS LEAGUE • REVANCHA TRAS SEMIFINALES!!!!</span>
                        <Star className="w-4 h-4 text-cyan-200 fill-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-bold border border-white/15 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Miércoles • 16:00 hs (Previa 15:00 hs)</span>
                      </div>
                    </div>

                    {/* Title Banner */}
                    <div className="relative z-10 text-center mb-5">
                      <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-rose-400 tracking-tight drop-shadow-md">
                        ¡¡¡PSG VS BAYERN MUNICH POR CHAMPIONS LEAGUE!!!!!!!!!!!
                      </h2>
                      <p className="text-xs sm:text-sm text-cyan-100/90 mt-1.5 max-w-2xl mx-auto font-medium">
                        ¡Se vuelven a enfrentar tras las semifinales! París Saint-Germain vs FC Bayern Múnich. Revancha histórica entre gigantes europeos con pantalla gigante 4K, amigos y prode en vivo.
                      </p>
                    </div>

                    {/* Epic Match Arena: PSG vs Bayern with official crests */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch my-2">
                      
                      {/* PARIS SAINT-GERMAIN */}
                      <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-[#00173d]/90 via-[#07214f]/90 to-[#1e0722]/80 p-5 border border-sky-500/40 text-center flex flex-col items-center justify-between shadow-xl transition-transform hover:scale-[1.02]">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-inner flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                            <img
                              src="/psg.svg"
                              alt="Paris Saint-Germain Logo"
                              className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(0,65,150,0.9)]"
                            />
                          </div>

                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">
                            Les Rouge-et-Bleu
                          </span>
                          <h3 className="text-xl font-black text-white mt-0.5">
                            PARIS SAINT-GERMAIN
                          </h3>
                          <p className="text-xs text-sky-200/80 mt-1 italic font-medium">
                            "Ici c'est Paris" • Parc des Princes
                          </p>
                        </div>

                        {/* Vote PSG Button */}
                        <button
                          type="button"
                          onClick={() => {
                            onVoteChampions?.('psg');
                            setChampionsBanterMessage('¡Ici c\'est Paris! 🔴🔵 Tu voto por París Saint-Germain fue registrado.');
                            setTimeout(() => setChampionsBanterMessage(null), 3500);
                          }}
                          className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-md ${
                            userChampVote === 'psg'
                              ? 'bg-sky-500 text-white ring-2 ring-white shadow-sky-500/40'
                              : 'bg-blue-800/80 hover:bg-blue-700 text-sky-100 hover:text-white border border-sky-400/40'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🔵🔴</span>
                            <span>{userChampVote === 'psg' ? '¡Tu voto: PSG!' : 'Votar PSG'}</span>
                          </span>
                          <span className="bg-slate-950/60 px-2.5 py-0.5 rounded-full text-[11px] text-sky-200 font-extrabold">
                            {psgVotes} ({psgPct}%)
                          </span>
                        </button>
                      </div>

                      {/* VS CENTER BADGE & PRODE STATS */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center text-center p-2">
                        <div className="relative flex items-center justify-center mb-2">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-rose-500 p-1 shadow-2xl shadow-cyan-500/30">
                            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                              <span className="text-base sm:text-lg font-black text-cyan-300 tracking-widest leading-none">VS</span>
                              <Trophy className="w-4 h-4 text-amber-400 mt-0.5" />
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300">
                          PRODE & ENCUESTA CHAMPIONS
                        </span>

                        {/* Draw Vote Button */}
                        <button
                          type="button"
                          onClick={() => {
                            onVoteChampions?.('draw');
                            setChampionsBanterMessage('¡Pronóstico de Empate 🤝! Definición infartante por penales o tiempo extra.');
                            setTimeout(() => setChampionsBanterMessage(null), 3500);
                          }}
                          className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            userChampVote === 'draw'
                              ? 'bg-slate-700 text-white ring-2 ring-cyan-400'
                              : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                          }`}
                        >
                          <span>🤝 Empate ({champDrawVotes} votos)</span>
                        </button>

                        {/* Dynamic Triple Percentage Bar */}
                        <div className="w-full mt-3">
                          <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
                            <span className="text-sky-400 font-black">PSG {psgPct}%</span>
                            <span className="text-slate-400">{champDrawPct}%</span>
                            <span className="text-rose-400 font-black">Bayern {bayernPct}%</span>
                          </div>
                          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-white/10">
                            <div style={{ width: `${psgPct}%` }} className="bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500" />
                            <div style={{ width: `${champDrawPct}%` }} className="bg-slate-500 transition-all duration-500" />
                            <div style={{ width: `${bayernPct}%` }} className="bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-500" />
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 mt-2">
                          Total votos: <strong className="text-white">{totalChampVotes}</strong>
                        </span>
                      </div>

                      {/* FC BAYERN MÜNCHEN */}
                      <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-[#38040d]/90 via-[#26050b]/90 to-[#0e0722]/80 p-5 border border-rose-500/40 text-center flex flex-col items-center justify-between shadow-xl transition-transform hover:scale-[1.02]">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-inner flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                            <img
                              src="/bayern.svg"
                              alt="FC Bayern München Logo"
                              className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(220,5,45,0.9)]"
                            />
                          </div>

                          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
                            Die Bayern
                          </span>
                          <h3 className="text-xl font-black text-white mt-0.5">
                            FC BAYERN MÜNCHEN
                          </h3>
                          <p className="text-xs text-rose-200/80 mt-1 italic font-medium">
                            "Mia san mia" • Allianz Arena
                          </p>
                        </div>

                        {/* Vote Bayern Button */}
                        <button
                          type="button"
                          onClick={() => {
                            onVoteChampions?.('bayern');
                            setChampionsBanterMessage('¡Mia san mia! 🔴⚪ Tu voto por FC Bayern München fue registrado.');
                            setTimeout(() => setChampionsBanterMessage(null), 3500);
                          }}
                          className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-md ${
                            userChampVote === 'bayern'
                              ? 'bg-rose-600 text-white ring-2 ring-white shadow-rose-500/40'
                              : 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 hover:text-white border border-rose-400/40'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🔴⚪</span>
                            <span>{userChampVote === 'bayern' ? '¡Tu voto: Bayern!' : 'Votar Bayern'}</span>
                          </span>
                          <span className="bg-slate-950/70 px-2.5 py-0.5 rounded-full text-[11px] text-rose-200 font-extrabold">
                            {bayernVotes} ({bayernPct}%)
                          </span>
                        </button>
                      </div>

                    </div>

                    {/* Banter Toast Message */}
                    {championsBanterMessage && (
                      <div className="relative z-10 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 text-slate-950 text-xs font-black text-center shadow-lg flex items-center justify-center gap-2 animate-bounce">
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>{championsBanterMessage}</span>
                      </div>
                    )}

                    {/* Venue & Watch Party Join RSVP */}
                    <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-left w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-xs text-cyan-300 font-black">
                          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>Sede: Bar Deportivo Champions & Club Europeo • Pantalla Gigante 4K</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Juntada masiva entre amigos, picada libre, cerveza/bebidas, audio de estadio envolvente y camisetas.
                          <strong className="text-white ml-1">{championsItem?.playersCount || 56} de 70 lugares reservados</strong>.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSportJoin?.('sport-champions')}
                        className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shrink-0 ${
                          championsItem?.isJoined
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-300'
                            : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-black hover:scale-105'
                        }`}
                      >
                        {championsItem?.isJoined ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>¡Anotado para la Champions!</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 fill-slate-950" />
                            <span>Sumarme a la Juntada de Champions League</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Chicanas de Champions League rápidas */}
                    <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">Alentar con amigos:</span>
                      {[
                        { text: '¡Ici c\'est Paris! 🔵🔴' },
                        { text: '¡Mia san Mia! 🔴⚪' },
                        { text: '¡La revancha más esperada tras las semis! ⚡🏆' },
                        { text: '¡Se define con gol en el 90! ⚽🔥' },
                      ].map((cheer, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setChampionsBanterMessage(cheer.text);
                            setTimeout(() => setChampionsBanterMessage(null), 3500);
                          }}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all cursor-pointer hover:border-cyan-400/50"
                        >
                          {cheer.text}
                        </button>
                      ))}
                    </div>
                  </div>

                {/* ======================================================== */}
                {/* ¡¡¡EL CLÁSICO!!!! FC BARCELONA VS REAL MADRID - DESTACADO */}
                {/* ======================================================== */}
                <div id="partido-clasico" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/80 p-5 sm:p-7 text-white shadow-2xl">
                  {/* Decorative ambient lighting */}
                  <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Badges */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-slate-950 font-black text-xs shadow-lg tracking-wider">
                      <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-pulse" />
                      <span>¡¡¡EL CLÁSICO MUNDIAL!!!!</span>
                      <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-pulse" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/15 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Domingo • 16:00 hs (Previa 15:00 hs)</span>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="relative z-10 text-center mb-5">
                    <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-300 to-rose-400 tracking-tight drop-shadow-md">
                      ¡¡¡EL CLÁSICO!!!! BARÇA VS REAL MADRID
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto">
                      El partido más esperado de la historia. Juntada masiva de amigos con pantalla gigante 4K, picada, camisetas y prode en vivo.
                    </p>
                  </div>

                  {/* Epic Match Arena: Barça vs Real Madrid with both official crest logos */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch my-2">
                    
                    {/* FC BARCELONA */}
                    <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-blue-950/80 via-slate-900/90 to-rose-950/70 p-5 border border-blue-500/40 text-center flex flex-col items-center justify-between shadow-xl transition-transform hover:scale-[1.02]">
                      <div className="flex flex-col items-center">
                        <div className="relative mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-inner flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                          <img
                            src="/barca.svg"
                            alt="FC Barcelona Logo"
                            className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(0,77,152,0.9)]"
                          />
                          <span className="absolute -bottom-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-300 shadow-md">
                            Blaugrana
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight">
                          FC BARCELONA
                        </h4>
                        <p className="text-xs text-blue-200/90 font-medium italic mt-0.5">
                          "Més que un club"
                        </p>
                      </div>

                      {/* Vote Barca Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onVoteClasico?.('barca');
                          setClasicoBanterMessage('¡Visca el Barça! 🔵🔴 Tu voto por Barcelona fue registrado en el Prode.');
                          setTimeout(() => setClasicoBanterMessage(null), 3500);
                        }}
                        className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-md ${
                          userVote === 'barca'
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-blue-500/30'
                            : 'bg-blue-800/80 hover:bg-blue-700 text-blue-100 hover:text-white border border-blue-400/40'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🔵🔴</span>
                          <span>{userVote === 'barca' ? '¡Tu voto: Barça!' : 'Votar Barça'}</span>
                        </span>
                        <span className="bg-slate-950/60 px-2.5 py-0.5 rounded-full text-[11px] text-blue-200 font-extrabold">
                          {barcaVotes} ({barcaPct}%)
                        </span>
                      </button>
                    </div>

                    {/* VS CENTER BADGE & PRODE STATS */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center text-center p-2">
                      <div className="relative flex items-center justify-center mb-2">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-300 p-1 shadow-2xl shadow-amber-500/30">
                          <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                            <span className="text-base sm:text-lg font-black text-amber-300 tracking-widest leading-none">VS</span>
                            <Swords className="w-4 h-4 text-rose-400 mt-0.5" />
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                        PRODE & ENCUESTA
                      </span>

                      {/* Draw Vote Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onVoteClasico?.('draw');
                          setClasicoBanterMessage('¡Pronóstico de Empate 🤝! Partido caliente y parejo hasta el 90.');
                          setTimeout(() => setClasicoBanterMessage(null), 3500);
                        }}
                        className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          userVote === 'draw'
                            ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                            : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                        }`}
                      >
                        <span>🤝 Empate ({drawVotes} votos)</span>
                      </button>

                      {/* Dynamic Triple Percentage Bar */}
                      <div className="w-full mt-3">
                        <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
                          <span className="text-blue-400 font-black">Barça {barcaPct}%</span>
                          <span className="text-slate-400">{drawPct}%</span>
                          <span className="text-amber-300 font-black">Madrid {madridPct}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-white/10">
                          <div style={{ width: `${barcaPct}%` }} className="bg-gradient-to-r from-blue-600 to-rose-600 transition-all duration-500" />
                          <div style={{ width: `${drawPct}%` }} className="bg-slate-500 transition-all duration-500" />
                          <div style={{ width: `${madridPct}%` }} className="bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500" />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {totalVotes} amigos ya votaron en la comunidad
                        </span>
                      </div>
                    </div>

                    {/* REAL MADRID */}
                    <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-slate-900/80 via-slate-900/95 to-amber-950/60 p-5 border border-amber-400/40 text-center flex flex-col items-center justify-between shadow-xl transition-transform hover:scale-[1.02]">
                      <div className="flex flex-col items-center">
                        <div className="relative mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-inner flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                          <img
                            src="/real-madrid.svg"
                            alt="Real Madrid CF Logo"
                            className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(254,190,16,0.9)]"
                          />
                          <span className="absolute -bottom-2 bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200 shadow-md">
                            Merengue
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-white tracking-tight">
                          REAL MADRID CF
                        </h4>
                        <p className="text-xs text-amber-200/90 font-medium italic mt-0.5">
                          "¡Hala Madrid y nada más!"
                        </p>
                      </div>

                      {/* Vote Madrid Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onVoteClasico?.('madrid');
                          setClasicoBanterMessage('¡Hala Madrid y nada más! 👑⚪ Tu voto por Real Madrid fue registrado.');
                          setTimeout(() => setClasicoBanterMessage(null), 3500);
                        }}
                        className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-md ${
                          userVote === 'madrid'
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-amber-500/30'
                            : 'bg-amber-500/80 hover:bg-amber-400 text-slate-950 font-black border border-amber-300/60'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>👑⚪</span>
                          <span>{userVote === 'madrid' ? '¡Tu voto: Madrid!' : 'Votar Madrid'}</span>
                        </span>
                        <span className="bg-slate-950/70 px-2.5 py-0.5 rounded-full text-[11px] text-amber-300 font-extrabold">
                          {madridVotes} ({madridPct}%)
                        </span>
                      </button>
                    </div>

                  </div>

                  {/* Banter Toast Message */}
                  {clasicoBanterMessage && (
                    <div className="relative z-10 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 text-xs font-black text-center shadow-lg flex items-center justify-center gap-2 animate-bounce">
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>{clasicoBanterMessage}</span>
                    </div>
                  )}

                  {/* Venue & Watch Party Join RSVP */}
                  <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-left w-full sm:w-auto">
                      <div className="flex items-center gap-2 text-xs text-amber-300 font-black">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Sede: Bar Deportivo La Cancha & Club Social • Pantalla Gigante 4K</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Juntada masiva entre amigos, picada libre, cerveza/bebidas, audio de estadio envolvente y camisetas.
                        <strong className="text-white ml-1">{clasicoItem?.playersCount || 48} de 60 lugares reservados</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSportJoin?.('sport-clasico')}
                      className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shrink-0 ${
                        clasicoItem?.isJoined
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black hover:scale-105'
                      }`}
                    >
                      {clasicoItem?.isJoined ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Anotado para El Clásico!</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 fill-slate-950" />
                          <span>Sumarme a la Juntada de El Clásico</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Chicanas futboleras rápidas */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Alentar con amigos:</span>
                    {[
                      { text: '¡Visca el Barça! 🔵🔴' },
                      { text: '¡¡Hala Madrid y nada más!! 👑⚪' },
                      { text: '¡Se define con gol en el 90! ⚽⚡' },
                      { text: '¡Yo llevo las pizzas y bebidas! 🍕🥤' },
                    ].map((cheer, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setClasicoBanterMessage(cheer.text);
                          setTimeout(() => setClasicoBanterMessage(null), 3000);
                        }}
                        className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all cursor-pointer hover:border-amber-400/50"
                      >
                        {cheer.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter by sport */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 mr-1">Filtrar evento:</span>
                  {[
                    { id: 'todos', label: 'Todos los eventos' },
                    { id: 'champions', label: '🏆 PSG vs Bayern (Champions)' },
                    { id: 'clásico', label: '🔥 El Clásico (Barça vs Madrid)' },
                    { id: 'fútbol', label: '⚽ Fútbol (5 y 7)' },
                    { id: 'pádel', label: '🎾 Pádel' },
                    { id: 'básquet', label: '🏀 Básquetbol' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedSportFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedSportFilter === tab.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Matches Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSports.map((item) => {
                    const spotsLeft = Math.max(0, item.maxPlayers - item.playersCount);
                    const isClasicoCard = item.isClasico || item.id === 'sport-clasico';
                    const isChampionsCard = item.isChampions || item.id === 'sport-champions';

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                          isChampionsCard
                            ? 'border-cyan-400 ring-2 ring-cyan-300/40 bg-gradient-to-br from-blue-50/40 via-white to-rose-50/30'
                            : isClasicoCard 
                            ? 'border-amber-400 ring-2 ring-amber-300/40 bg-gradient-to-br from-amber-50/40 to-white' 
                            : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-900">
                            {isChampionsCard ? (
                              <div className="relative w-full h-full bg-gradient-to-r from-[#03153c] via-slate-900 to-[#4a0d17] flex items-center justify-around p-3">
                                <div className="flex flex-col items-center">
                                  <img src="/psg.svg" alt="PSG" className="w-14 h-14 object-contain drop-shadow-md" />
                                  <span className="text-[10px] font-black text-sky-300 mt-1">PSG</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-black text-cyan-300 tracking-wider">VS</span>
                                  <span className="text-[9px] font-black bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full uppercase mt-1">
                                    CHAMPIONS
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <img src="/bayern.svg" alt="Bayern" className="w-14 h-14 object-contain drop-shadow-md" />
                                  <span className="text-[10px] font-black text-rose-300 mt-1">BAYERN</span>
                                </div>
                              </div>
                            ) : isClasicoCard ? (
                              <div className="relative w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 flex items-center justify-around p-3">
                                <div className="flex flex-col items-center">
                                  <img src="/barca.svg" alt="Barça" className="w-14 h-14 object-contain drop-shadow-md" />
                                  <span className="text-[10px] font-black text-blue-300 mt-1">BARÇA</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-black text-amber-300 tracking-wider">VS</span>
                                  <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase mt-1">
                                    EL CLÁSICO
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <img src="/real-madrid.svg" alt="Real Madrid" className="w-14 h-14 object-contain drop-shadow-md" />
                                  <span className="text-[10px] font-black text-amber-300 mt-1">MADRID</span>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}

                            <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                              <Trophy className="w-3 h-3 text-emerald-400" />
                              <span>{item.sport}</span>
                            </div>

                            <div className={`absolute bottom-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${
                              isChampionsCard
                                ? 'bg-cyan-400 text-slate-950'
                                : isClasicoCard 
                                ? 'bg-amber-400 text-slate-950'
                                : spotsLeft === 1
                                ? 'bg-amber-400 text-slate-950 animate-pulse'
                                : spotsLeft > 1
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-200'
                            }`}>
                              <Users className="w-3 h-3" />
                              <span>
                                {isChampionsCard || isClasicoCard
                                  ? `${item.playersCount}/${item.maxPlayers} Amigos anotados` 
                                  : spotsLeft === 1 
                                  ? '¡FALTA 1 JUGADOR!' 
                                  : `${item.playersCount}/${item.maxPlayers} Jugadores`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isChampionsCard
                                ? 'text-cyan-900 bg-cyan-100 border-cyan-300'
                                : isClasicoCard
                                ? 'text-amber-800 bg-amber-100 border-amber-300'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            }`}>
                              {isChampionsCard 
                                ? '⭐ REVANCHA TRAS SEMIFINALES • PANTALLA 4K'
                                : isClasicoCard 
                                ? '⭐ JUNTADA ESPECIAL EN PANTALLA GIGANTE' 
                                : `Nivel: ${item.level}`}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm mb-1 leading-snug">
                            {item.title}
                          </h4>

                          {item.notes && (
                            <p className="text-xs text-slate-600 mb-2.5 line-clamp-2 leading-relaxed">
                              {item.notes}
                            </p>
                          )}

                          <div className="space-y-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                          <span className="text-[11px] font-medium text-slate-500">
                            {item.isJoined 
                              ? '¡Estás anotado!' 
                              : isChampionsCard || isClasicoCard
                              ? 'Unirse a la hinchada' 
                              : spotsLeft === 1 
                              ? '¡Completa el equipo!' 
                              : 'Súmate al picadito'}
                          </span>
                          <button
                            onClick={() => onToggleSportJoin && onToggleSportJoin(item.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              item.isJoined
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isChampionsCard
                                ? 'bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black'
                                : isClasicoCard
                                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                                : 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.isJoined ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {item.isJoined ? 'Anotado' : isChampionsCard || isClasicoCard ? 'Sumarme' : 'Sumarme'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Matching Friends who love sports */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Amigos con afinidad a Deportes & Fútbol ({sportsFriends.length})</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sportsFriends.map((friend) => {
                      const comp = calculateCompatibility(friend, currentUserProfile);
                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all cursor-pointer"
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
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : 'bg-slate-100 hover:bg-emerald-50 border-slate-200 text-slate-700 hover:text-emerald-600'
                              }`}
                              title={friend.isConnected ? 'Conectado' : 'Conectar para jugar'}
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
