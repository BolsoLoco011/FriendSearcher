import React, { useState, useEffect } from 'react';
import { X, Sparkles, Laugh, Utensils, CalendarCheck, Users, MapPin, Briefcase, Send, UserCheck, UserPlus, MessageCircle, Cloud, Edit3, Camera, Check, Image as ImageIcon } from 'lucide-react';
import { FriendProfile } from '../types';
import { db, collection, addDoc, query, where, onSnapshot, setDoc, doc } from '../firebase';
import { calculateCompatibility } from '../utils/compatibility';

interface FriendDetailModalProps {
  friend: FriendProfile | null;
  onClose: () => void;
  onToggleConnect: (id: string) => void;
  currentUserProfile?: FriendProfile | null;
  isAdmin?: boolean;
  onEditUserInDb?: (friend: FriendProfile) => void;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
  friend,
  onClose,
  onToggleConnect,
  currentUserProfile,
  isAdmin = false,
  onEditUserInDb,
}) => {
  if (!friend) return null;

  const compatibility = calculateCompatibility(friend, currentUserProfile);

  const [currentAvatar, setCurrentAvatar] = useState(friend.avatar);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCurrentAvatar(friend.avatar);
  }, [friend.avatar, friend.id]);

  const handleSelectAvatar = async (newAvatar: string, label: string) => {
    setCurrentAvatar(newAvatar);
    setPhotoFeedback(`Foto cambiada a: ${label}`);
    setTimeout(() => setPhotoFeedback(null), 2500);

    try {
      await setDoc(doc(db, 'users', friend.id), { avatar: newAvatar }, { merge: true });
    } catch (e) {
      console.warn('Could not update avatar in Firestore:', e);
    }
  };

  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'friend'; text: string; time: string }>>([
    {
      sender: 'friend',
      text: `¡Hola! Me alegra que veas mi perfil en FriendSearcher. Me encanta compartir sobre ${friend.favoriteFood} y reírme con ${friend.favoriteMemeStyle}. ¿Qué planes tienes?`,
      time: '12:00'
    }
  ]);

  // Load and listen to messages in Firestore
  useEffect(() => {
    if (!friend.id) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('friendId', '==', friend.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs
            .map(doc => doc.data() as { sender: 'user' | 'friend'; text: string; time: string; createdAt?: number })
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

          if (loaded.length > 0) {
            setChatHistory(loaded);
          }
        }
      }, (error) => {
        console.warn('Firestore messages listener notice:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore messages error:', e);
    }
  }, [friend.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const userText = messageInput.trim();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg = {
      sender: 'user' as const,
      text: userText,
      time: timeStr,
      friendId: friend.id,
      createdAt: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setMessageInput('');

    // Save to Firestore
    try {
      await addDoc(collection(db, 'messages'), userMsg);
    } catch (err) {
      console.warn('Error saving message to Firestore:', err);
    }

    // Friendly reply saved to Firestore
    setTimeout(async () => {
      let reply = `¡Genial! Me encanta esa vibra. Tenemos un ${compatibility.score}% de afinidad real calculada en FriendSearcher, deberíamos coordinar para el evento "${friend.joinedEvent}"!`;
      if (userText.toLowerCase().includes('comida') || userText.toLowerCase().includes('cocina') || userText.toLowerCase().includes('comer')) {
        reply = `¡Totalmente de acuerdo! Mi plato favorito definitivo es ${friend.favoriteFood}. ¿Conoces algún buen lugar por ahí?`;
      } else if (userText.toLowerCase().includes('meme') || userText.toLowerCase().includes('jaja')) {
        reply = `Jajaja, mi humor es 100% "${friend.favoriteMemeStyle}". Ya me caíste súper bien!`;
      }

      const friendMsg = {
        sender: 'friend' as const,
        text: reply,
        time: timeStr,
        friendId: friend.id,
        createdAt: Date.now() + 10
      };

      setChatHistory(prev => [...prev, friendMsg]);

      try {
        await addDoc(collection(db, 'messages'), friendMsg);
      } catch (err) {
        console.warn('Error saving friend reply to Firestore:', err);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-sky-100 via-slate-100 to-indigo-100 border-b border-slate-200/70">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all z-20 shadow-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex flex-wrap items-end justify-between gap-4 z-10">
            <div className="flex items-end gap-3.5">
              <div className="relative">
                <img
                  src={currentAvatar}
                  alt={friend.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-900"
                />
                <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-xs ${
                  compatibility.score >= 90 ? 'bg-emerald-500' : compatibility.score >= 75 ? 'bg-sky-500' : 'bg-indigo-500'
                }`}>
                  {compatibility.score}% MATCH
                </span>
              </div>

              <div className="text-slate-800 pb-1">
                <h2 className="text-xl sm:text-2xl font-bold">{friend.name}, {friend.age}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1 font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-sky-600" /> {friend.city}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-sky-600" /> {friend.occupation}</span>
                </div>
              </div>
            </div>

            {/* Quick photo switch if Benja or has secondary avatar */}
            {(friend.id === 'f-1' || friend.secondaryAvatar || friend.name.toLowerCase().includes('benja')) && (
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-sky-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAvatar('/benja.svg', 'Corona Chalk')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    currentAvatar === '/benja.svg' || currentAvatar.includes('crown')
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-sky-100'
                  }`}
                  title="Usar Corona Chalk como avatar"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Corona
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAvatar('/benja-cat.svg', 'Gatito')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    currentAvatar === '/benja-cat.svg' || currentAvatar.includes('cat')
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-sky-100'
                  }`}
                  title="Usar Gatito como avatar"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Gatito
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback toast when avatar changed */}
        {photoFeedback && (
          <div className="mx-6 mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {photoFeedback}
          </div>
        )}

        {/* Profile Details & 5 Pillars */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Bio */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Acerca de mí</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{friend.bio}</p>
          </div>

          {/* Fotos de Benja (Corona & Gatito) */}
          {(friend.id === 'f-1' || friend.secondaryAvatar || friend.name.toLowerCase().includes('benja')) && (
            <div className="bg-white border border-sky-200 p-4 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-600" />
                  Fotos del perfil ({currentAvatar === '/benja-cat.svg' ? 'Gatito activo' : 'Corona activa'})
                </h4>
                <span className="text-[10px] text-sky-700 font-medium">Toca para cambiar avatar</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Photo 1: Corona */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatar('/benja.svg', 'Corona Chalk')}
                  className={`group text-left relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    currentAvatar === '/benja.svg' || currentAvatar.includes('crown')
                      ? 'border-sky-500 shadow-md ring-2 ring-sky-200'
                      : 'border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="aspect-4/3 bg-black flex items-center justify-center p-2">
                    <img 
                      src="/benja.svg" 
                      alt="Corona Graffiti" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div className="p-2 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                    <div>
                      <p className="font-bold">Corona Chalk</p>
                      <p className="text-[10px] text-slate-400">Estilo graffiti blanco</p>
                    </div>
                    {(currentAvatar === '/benja.svg' || currentAvatar.includes('crown')) && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </div>
                </button>

                {/* Photo 2: Gatito en la Cama */}
                <button
                  type="button"
                  onClick={() => handleSelectAvatar('/benja-cat.svg', 'Gatito en la Cama')}
                  className={`group text-left relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    currentAvatar === '/benja-cat.svg' || currentAvatar.includes('cat')
                      ? 'border-sky-500 shadow-md ring-2 ring-sky-200'
                      : 'border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="aspect-4/3 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/benja-cat.svg" 
                      alt="Gatito en la Cama" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div className="p-2 bg-slate-800 text-white text-[11px] flex items-center justify-between">
                    <div>
                      <p className="font-bold">Gatito en la Cama</p>
                      <p className="text-[10px] text-slate-400">Michi durmiendo</p>
                    </div>
                    {(currentAvatar === '/benja-cat.svg' || currentAvatar.includes('cat')) && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Affinity Analysis Card */}
          <div className="bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/80 border border-sky-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Afinidad Calculada en Vivo</h4>
                  <p className="text-[10px] text-slate-500">Basada en comida favorita, humor, intereses y ubicación</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-sky-600">{compatibility.score}%</span>
                <span className="text-[10px] font-bold text-slate-500 block">{compatibility.affinityLevel}</span>
              </div>
            </div>

            {/* Affinity reasons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {compatibility.reasons.map((reason, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-white text-sky-800 border border-sky-200/80 text-[11px] font-medium shadow-2xs">
                  ✓ {reason}
                </span>
              ))}
            </div>
          </div>

          {/* Los 5 Pilares de afinidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. Características */}
            <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Características & Rasgos</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {friend.traits.map(trait => (
                  <span key={trait} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Memes */}
            <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-2">
                <Laugh className="w-4 h-4 text-amber-500" />
                <span>Estilo de Memes & Humor</span>
              </div>
              <p className="text-xs text-amber-900 font-medium bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
                "{friend.favoriteMemeStyle}"
              </p>
            </div>

            {/* 3. Cocina */}
            <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Gusto Culinario & Cocina</span>
                </div>
                {isAdmin && onEditUserInDb && (
                  <button
                    type="button"
                    onClick={() => onEditUserInDb(friend)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
                    title="Modificar comida favorita en Firestore"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-600" />
                    <span>Editar Comida</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-emerald-950 font-bold bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
                {friend.favoriteFood}
              </p>
            </div>

            {/* 4. Eventos */}
            <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-700 mb-2">
                <CalendarCheck className="w-4 h-4 text-fuchsia-600" />
                <span>Próximo Evento</span>
              </div>
              <p className="text-xs text-fuchsia-900 font-medium bg-fuchsia-50/70 p-2.5 rounded-xl border border-fuchsia-200/70">
                {friend.joinedEvent}
              </p>
            </div>

            {/* 5. Grupos (full width) */}
            <div className="sm:col-span-2 bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Comunidad / Grupo Activo</span>
              </div>
              <p className="text-xs text-blue-900 font-medium bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/70">
                {friend.joinedGroup}
              </p>
            </div>
          </div>

          {/* Chat Simulator */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-sky-500" />
              Chat Directo con {friend.name}
            </h3>

            <div className="space-y-2.5 max-h-40 overflow-y-auto mb-3 pr-1 text-xs">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-500 text-white rounded-br-none shadow-xs'
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Escribe un mensaje a ${friend.name}...`}
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleConnect(friend.id)}
              className={`px-5 py-2 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                friend.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
              }`}
            >
              {friend.isConnected ? <UserCheck className="w-4 h-4 text-emerald-600" /> : <UserPlus className="w-4 h-4" />}
              {friend.isConnected ? 'Conectados como Amigos' : 'Conectar con ' + friend.name.split(' ')[0]}
            </button>

            {isAdmin && onEditUserInDb && (
              <button
                type="button"
                onClick={() => onEditUserInDb(friend)}
                className="px-4 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Modificar datos y favoriteFood en Firestore"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Modificar en Firestore</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
