import React, { useState } from 'react';
import { X, CalendarCheck, Laugh, Utensils, UserPlus, Check } from 'lucide-react';
import { FriendProfile, MemeItem, CookingItem, EventItem } from '../types';
import { ImageUploadField } from './ImageUploadField';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: EventItem) => void;
  onAddMeme: (meme: MemeItem) => void;
  onAddCooking: (cooking: CookingItem) => void;
  onAddFriend: (friend: FriendProfile) => void;
}

type TabType = 'perfil' | 'evento' | 'meme' | 'cocina';

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  onAddMeme,
  onAddCooking,
  onAddFriend,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [successMsg, setSuccessMsg] = useState('');

  // Perfil form
  const [name, setName] = useState('');
  const [age, setAge] = useState(12);
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [favoriteMemeStyle, setFavoriteMemeStyle] = useState('');
  const [traitsInput, setTraitsInput] = useState('DEPORTES, MUSICA, VIDEOJUEGOS');

  // Evento form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('Próximo sábado');
  const [eventTime, setEventTime] = useState('20:00 hs');
  const [eventLocation, setEventLocation] = useState('Centro Cultural');
  const [eventCategory, setEventCategory] = useState('Social & Encuentro');
  const [eventImageUrl, setEventImageUrl] = useState('');

  // Meme form
  const [memeTitle, setMemeTitle] = useState('');
  const [memeTag, setMemeTag] = useState('Humor Diario');
  const [memeImageUrl, setMemeImageUrl] = useState('');

  // Cocina form
  const [cookingTitle, setCookingTitle] = useState('');
  const [cuisine, setCuisine] = useState('Pizzas & Tapas');
  const [cookingDate, setCookingDate] = useState('Viernes 20:30 hs');
  const [cookingImageUrl, setCookingImageUrl] = useState('');

  const handleCreateFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFriend: FriendProfile = {
      id: `f-${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 24,
      avatar: avatarUrl.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      city: city.trim() || 'Tu Ciudad',
      occupation: occupation.trim() || 'Entusiasta & Creador',
      bio: bio.trim() || '¡Nuevo en FriendSearcher! Listo para conectar con gente genial y compartir buenos momentos.',
      matchScore: 99,
      highlightCategory: 'caracteristicas',
      traits: traitsInput.split(',').map(t => t.trim()).filter(Boolean),
      favoriteFood: favoriteFood.trim() || 'Hamburguesas & Tacos',
      favoriteMemeStyle: favoriteMemeStyle.trim() || 'Memes de series y gatos',
      joinedEvent: 'Quedada de bienvenida FriendSearcher',
      joinedGroup: 'Comunidad Oficial FriendSearcher',
      isConnected: true
    };

    onAddFriend(newFriend);
    showSuccess('¡Perfil agregado con éxito a la red!');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEv: EventItem = {
      id: `e-${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      imageUrl: eventImageUrl.trim() || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
      attendees: 1,
      categoryTag: eventCategory,
      isJoined: true
    };

    onAddEvent(newEv);
    showSuccess('¡Evento 4K publicado correctamente!');
  };

  const handleCreateMeme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memeTitle.trim()) return;

    const newMeme: MemeItem = {
      id: `m-${Date.now()}`,
      title: memeTitle.trim(),
      imageUrl: memeImageUrl.trim() || '/meme.png',
      likes: 1,
      author: 'Tú',
      sharedByFriend: 'Tú (FriendSearcher)',
      tag: memeTag,
      userVoted: true
    };

    onAddMeme(newMeme);
    showSuccess('¡Meme añadido al muro 4K HD!');
  };

  const handleCreateCooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookingTitle.trim()) return;

    const newCooking: CookingItem = {
      id: `c-${Date.now()}`,
      title: cookingTitle.trim(),
      cuisine: cuisine,
      level: 'Abierto a todos',
      hostName: 'Tú',
      imageUrl: cookingImageUrl.trim() || '/comida.png',
      membersInterested: 1,
      nextGathering: cookingDate
    };

    onAddCooking(newCooking);
    showSuccess('¡Quedada gastronómica agendada!');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Publicar en FriendSearcher</h2>
            <p className="text-xs text-slate-500 font-medium">Crea un perfil, evento, meme o plan de cocina</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'perfil' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('evento')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'evento' ? 'bg-white text-fuchsia-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Evento
          </button>
          <button
            onClick={() => setActiveTab('meme')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'meme' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laugh className="w-3.5 h-3.5" />
            Meme
          </button>
          <button
            onClick={() => setActiveTab('cocina')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'cocina' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Cocina
          </button>
        </div>

        {/* Forms */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* TAB: Perfil */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleCreateFriend} className="space-y-3.5 text-xs">
              <ImageUploadField
                id="perfil-avatar-upload"
                label="Foto de Perfil (Opcional)"
                value={avatarUrl}
                onChange={setAvatarUrl}
                aspectHint="Arrastra tu foto o selfie (JPG, PNG)"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Herrera"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Edad</label>
                  <input
                    type="number"
                    min="10"
                    max="110"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: Montevideo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ocupación / Hobbies</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Ej: Diseñadora & Amante de los gatos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Biografía</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Comida favorita</label>
                  <input
                    type="text"
                    value={favoriteFood}
                    onChange={(e) => setFavoriteFood(e.target.value)}
                    placeholder="Ej: Tacos al pastor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estilo de memes</label>
                  <input
                    type="text"
                    value={favoriteMemeStyle}
                    onChange={(e) => setFavoriteMemeStyle(e.target.value)}
                    placeholder="Ej: Humor absurdo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Características & Pasiones</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['DEPORTES', 'MUSICA', 'GIMNASIO', 'VIDEOJUEGOS', 'NATURALEZA', 'INFORMATICA', 'MEMES'].map((tag) => {
                    const isIncluded = traitsInput.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isIncluded) {
                            const updated = traitsInput
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s.toLowerCase() !== tag.toLowerCase())
                              .join(', ');
                            setTraitsInput(updated);
                          } else {
                            const updated = traitsInput.trim()
                              ? `${traitsInput.trim()}, ${tag}`
                              : tag;
                            setTraitsInput(updated);
                          }
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isIncluded
                            ? 'bg-sky-500 text-white border-sky-500 shadow-2xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        {isIncluded ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={traitsInput}
                  onChange={(e) => setTraitsInput(e.target.value)}
                  placeholder="DEPORTES, MUSICA, VIDEOJUEGOS..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-xs mt-2 cursor-pointer"
              >
                Crear Perfil en FriendSearcher
              </button>
            </form>
          )}

          {/* TAB: Evento */}
          {activeTab === 'evento' && (
            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <ImageUploadField
                id="evento-image-upload"
                label="Foto / Portada del Evento (Opcional)"
                value={eventImageUrl}
                onChange={setEventImageUrl}
                aspectHint="Banner o foto del lugar (JPG, PNG)"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Título del Evento *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ej: Tarde de juegos de rol & pizzas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fecha</label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hora</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lugar / Ubicación</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ej: Parque de la Ciudad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoría</label>
                <input
                  type="text"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition-all shadow-xs mt-2 cursor-pointer"
              >
                Publicar Evento 4K
              </button>
            </form>
          )}

          {/* TAB: Meme */}
          {activeTab === 'meme' && (
            <form onSubmit={handleCreateMeme} className="space-y-3.5 text-xs">
              <ImageUploadField
                id="meme-image-upload"
                label="Imagen o Meme (Opcional)"
                value={memeImageUrl}
                onChange={setMemeImageUrl}
                aspectHint="Captura, foto o meme (JPG, PNG)"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Título / Texto del Meme *</label>
                <textarea
                  required
                  rows={2}
                  value={memeTitle}
                  onChange={(e) => setMemeTitle(e.target.value)}
                  placeholder="Ej: Cuando te invitan a salir pero ya te pusiste el pijama..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Etiqueta de Humor</label>
                <input
                  type="text"
                  value={memeTag}
                  onChange={(e) => setMemeTag(e.target.value)}
                  placeholder="Ej: Humor Trabajo, Gatos, Amistad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-xs mt-2 cursor-pointer"
              >
                Subir Meme 4K al Muro
              </button>
            </form>
          )}

          {/* TAB: Cocina */}
          {activeTab === 'cocina' && (
            <form onSubmit={handleCreateCooking} className="space-y-3.5 text-xs">
              <ImageUploadField
                id="cocina-image-upload"
                label="Foto del Plato o Encuentro (Opcional)"
                value={cookingImageUrl}
                onChange={setCookingImageUrl}
                aspectHint="Foto de comida o receta (JPG, PNG)"
              />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre de la Quedada Gastronómica *</label>
                <input
                  type="text"
                  required
                  value={cookingTitle}
                  onChange={(e) => setCookingTitle(e.target.value)}
                  placeholder="Ej: Taller de Sushi Casero & Ramen"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Cocina</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="Ej: Japonesa, Asado, Pastas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Día y Hora</label>
                  <input
                    type="text"
                    value={cookingDate}
                    onChange={(e) => setCookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs mt-2 cursor-pointer"
              >
                Crear Quedada Culinaria
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
