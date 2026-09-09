import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Utensils, 
  Smile, 
  Tag, 
  Check, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { User, db, doc, setDoc, collection, getDocs, deleteDoc } from '../firebase';
import { ImageUploadField } from './ImageUploadField';
import { isUserAdmin } from '../config/admin';

interface OnboardingProfileModalProps {
  currentUser: User;
  isOpen: boolean;
  initialData?: {
    name?: string;
    age?: number;
    city?: string;
    occupation?: string;
    bio?: string;
    avatar?: string;
    favoriteFood?: string;
    favoriteMemeStyle?: string;
    traits?: string[];
    isAdmin?: boolean;
    role?: string;
  };
  onComplete: () => void;
}

const AVAILABLE_TRAITS = [
  'VIDEOJUEGOS',
  'DEPORTES',
  'FUTBOL',
  'MEMES',
  'MUSICA',
  'GASTRONOMIA',
  'CINE Y SERIES',
  'TECNOLOGIA',
  'NATURALEZA',
  'FOTOGRAFIA',
  'LIBROS',
  'VIAJES'
];

const SUGGESTED_FOODS = [
  'Milanesas con papas fritas',
  'Fideos y pastas caseras',
  'Asado criollo',
  'Smash Burgers',
  'Pizzas artesanales',
  'Sushi & Comida asiática',
  'Tacos y empanadas'
];

const SUGGESTED_MEME_STYLES = [
  'Memes de fútbol',
  'Humor absurdo / Shitpost',
  'Memes de gatos y animales',
  'Memes de programadores / tech',
  'Memes de series y películas',
  'Memes existencialistas de la vida diaria'
];

export const OnboardingProfileModal: React.FC<OnboardingProfileModalProps> = ({
  currentUser,
  isOpen,
  initialData,
  onComplete
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialData?.name || currentUser.displayName || '');
  const [age, setAge] = useState<number | string>(initialData?.age || 12);
  const [city, setCity] = useState(initialData?.city || '');
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [avatar, setAvatar] = useState(initialData?.avatar || currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
  const [favoriteFood, setFavoriteFood] = useState(initialData?.favoriteFood || '');
  const [favoriteMemeStyle, setFavoriteMemeStyle] = useState(initialData?.favoriteMemeStyle || '');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    initialData?.traits && initialData.traits.length > 0 
      ? initialData.traits 
      : ['VIDEOJUEGOS', 'MEMES']
  );
  const [customTrait, setCustomTrait] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state whenever initialData changes (or user profile updates)
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.age) setAge(initialData.age);
      if (initialData.city) setCity(initialData.city);
      if (initialData.occupation) setOccupation(initialData.occupation);
      if (initialData.bio) setBio(initialData.bio);
      if (initialData.avatar) setAvatar(initialData.avatar);
      if (initialData.favoriteFood) setFavoriteFood(initialData.favoriteFood);
      if (initialData.favoriteMemeStyle) setFavoriteMemeStyle(initialData.favoriteMemeStyle);
      if (initialData.traits && initialData.traits.length > 0) setSelectedTraits(initialData.traits);
    }
  }, [initialData, isOpen]);

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const handleAddCustomTrait = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTrait.trim().toUpperCase();
    if (clean && !selectedTraits.includes(clean)) {
      setSelectedTraits([...selectedTraits, clean]);
      setCustomTrait('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre.');
      return;
    }
    const parsedAge = Number(age);
    if (!parsedAge || parsedAge < 10 || parsedAge > 110) {
      setErrorMsg('Por favor ingresa una edad válida (mínimo 10 años).');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Por favor indica tu ciudad o ubicación.');
      return;
    }
    if (!favoriteFood.trim()) {
      setErrorMsg('Por favor cuéntanos cuál es tu comida favorita.');
      return;
    }
    if (!favoriteMemeStyle.trim()) {
      setErrorMsg('Por favor indica qué estilo de memes te da más gracia.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const userProfile = {
        id: currentUser.uid,
        name: name.trim(),
        email: currentUser.email || '',
        age: parsedAge,
        city: city.trim(),
        occupation: occupation.trim() || 'Miembro de la comunidad',
        bio: bio.trim() || `¡Hola! Me uní a FriendSearcher para conocer gente con gustos similares. Me encanta ${favoriteFood} y los ${favoriteMemeStyle}.`,
        avatar: avatar.trim() || currentUser.photoURL || '/benja.svg',
        matchScore: 98,
        highlightCategory: 'caracteristicas',
        traits: selectedTraits.length > 0 ? selectedTraits : ['AMISTAD', 'BUENA ONDA'],
        favoriteFood: favoriteFood.trim(),
        favoriteMemeStyle: favoriteMemeStyle.trim(),
        joinedEvent: 'Bienvenida a FriendSearcher',
        joinedGroup: 'Comunidad FriendSearcher',
        isConnected: false,
        isAdmin: initialData?.isAdmin !== undefined ? initialData.isAdmin : isUserAdmin(currentUser.email),
        role: initialData?.role || (isUserAdmin(currentUser.email) ? 'admin' : 'user'),
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', currentUser.uid), userProfile, { merge: true });

      // Clean up any historical duplicate documents in Firestore matching this user's email or exact name
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const cleanCurrentEmail = (currentUser.email || '').toLowerCase().trim();
        const cleanCurrentName = name.trim().toLowerCase();

        for (const userDoc of usersSnap.docs) {
          if (userDoc.id !== currentUser.uid) {
            const data = userDoc.data();
            const docEmail = (data.email || '').toLowerCase().trim();
            const docName = (data.name || '').toLowerCase().trim();

            if ((cleanCurrentEmail && docEmail === cleanCurrentEmail) || (cleanCurrentName && docName === cleanCurrentName)) {
              // Delete outdated duplicate document so the old favoriteFood NEVER reverts
              await deleteDoc(doc(db, 'users', userDoc.id)).catch(console.error);
            }
          }
        }
      } catch (cleanupErr) {
        console.warn('Duplicate cleanup notice:', cleanupErr);
      }

      onComplete();
    } catch (err: unknown) {
      console.error('Error saving onboarding profile to Firestore:', err);
      setErrorMsg('Ocurrió un error al guardar tu perfil en Firestore. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        id="onboarding-modal-card"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500 text-white flex-shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">¡Bienvenido a FriendSearcher!</h2>
            <p className="text-xs text-sky-100">
              Para conectarte con personas afines, completa las preguntas de tu perfil.
            </p>
          </div>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* 1. Datos básicos: Nombre y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <span>Tu nombre completo</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>Edad</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="10"
                max="110"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej. 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
              />
            </div>
          </div>

          {/* 2. Ubicación y Ocupación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>Ubicación / Ciudad</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Buenos Aires, Córdoba, Rosario..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                <span>Ocupación o Interés principal</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Ej. Desarrollador & Gamer, Diseñador..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
              />
            </div>
          </div>

          {/* 3. Comida favorita */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>¿Cuál es tu comida favorita?</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              placeholder="Ej. Fideos con tuco, Milanesas con papas fritas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1 self-center">Sugerencias:</span>
              {SUGGESTED_FOODS.map(f => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFavoriteFood(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    favoriteFood === f 
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Estilo de Memes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-purple-500" />
              <span>¿Qué tipo de humor o memes te dan más gracia?</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={favoriteMemeStyle}
              onChange={(e) => setFavoriteMemeStyle(e.target.value)}
              placeholder="Ej. Memes de fútbol, Shitpost, Gatos..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1 self-center">Sugerencias:</span>
              {SUGGESTED_MEME_STYLES.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setFavoriteMemeStyle(m)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    favoriteMemeStyle === m 
                      ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Intereses / Traits */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-500" />
              <span>Tus características e intereses (Selecciona al menos 2)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {AVAILABLE_TRAITS.map(t => {
                const isSelected = selectedTraits.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleTrait(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom trait input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTrait}
                onChange={(e) => setCustomTrait(e.target.value)}
                onKeyDown={handleAddCustomTrait}
                placeholder="Agregar otro interés o característica..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddCustomTrait}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* 6. Biografía */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Sobre ti (Biografía breve)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos un poco sobre tu personalidad, tus hobbies o qué planes te gusta hacer los fines de semana..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
            />
          </div>

          {/* 7. Foto de Perfil */}
          <div className="pt-1">
            <ImageUploadField
              label="Foto de perfil o Avatar"
              value={avatar}
              onChange={setAvatar}
              placeholder="URL de foto o sube una imagen"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-black shadow-md shadow-sky-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando tu perfil en Firestore...</span>
                </>
              ) : (
                <>
                  <span>Guardar mi perfil y comenzar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
