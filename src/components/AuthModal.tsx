import React, { useState } from 'react';
import { X, LogIn, LogOut, User as UserIcon, Sparkles, ShieldCheck, Check, Database } from 'lucide-react';
import { auth, googleProvider, microsoftProvider, signInWithPopup, signOut, User } from '../firebase';
import { isUserAdmin } from '../config/admin';
import { AuthorizedEmail, SchoolSettings } from '../types';
import { validateSchoolEmail, checkSchoolEmailAuthorizationAsync } from '../utils/schoolAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenEditProfile?: () => void;
  onOpenDbManager?: () => void;
  onLoginSuccess?: (user: User) => void;
  whitelist?: AuthorizedEmail[];
  schoolSettings?: SchoolSettings;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenEditProfile,
  onOpenDbManager,
  whitelist = [],
  schoolSettings = { enforceWhitelist: true },
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // School whitelist validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings);
      if (!validation.isAllowed) {
        await signOut(auth);
        setErrorMsg(validation.reason || 'Tu cuenta de Google no figura en el padrón escolar.');
        return;
      }

      onClose();
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('La ventana de inicio de sesión fue cerrada.');
      } else {
        setErrorMsg('No se pudo conectar con Google. Puedes usar tu cuenta institucional de Microsoft.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, microsoftProvider);
      const user = res.user;

      // School whitelist validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings);
      if (!validation.isAllowed) {
        await signOut(auth);
        setErrorMsg(validation.reason || 'Tu cuenta de Microsoft no figura en el padrón escolar.');
        return;
      }

      onClose();
    } catch (err: unknown) {
      console.error('Microsoft Sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('La ventana de inicio de sesión fue cerrada.');
      } else {
        setErrorMsg('No se pudo conectar con Microsoft. Verifica tu cuenta o usa Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full ring-4 ring-sky-100 overflow-hidden bg-slate-100 flex items-center justify-center">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'Usuario'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {currentUser.displayName || (currentUser.isAnonymous ? 'Invitado Activo' : 'Usuario')}
                </h3>
                {isUserAdmin(currentUser.email) && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.email || (currentUser.isAnonymous ? 'Modo invitado (Datos sincronizados en Firestore)' : currentUser.uid)}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base de datos en la nube conectada</span>
              </div>
            </div>

            {isUserAdmin(currentUser.email) && onOpenDbManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDbManager();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Database className="w-4 h-4 text-amber-700" />
                <span>Explorar BD Firestore (Admin)</span>
              </button>
            )}

            {onOpenEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditProfile();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Editar mis preguntas y perfil</span>
              </button>
            )}

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                id="btn-signout"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Volver a la App
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 flex items-center justify-center mx-auto mb-2.5">
                <img src="/logo.svg" alt="FriendSearcher Logo" className="w-14 h-14 object-contain drop-shadow-sm" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Conéctate a FriendSearcher
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Guarda tus amigos, memes y eventos en la base de datos para acceder desde cualquier dispositivo.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                id="btn-microsoft-login"
                onClick={handleMicrosoftSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-xs hover:border-slate-400"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span>Continuar con Microsoft (Escolar)</span>
              </button>

              <button
                id="btn-google-login"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-xs hover:border-slate-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google (Administrador)</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 pt-2">
              Tus datos se almacenan de forma segura en Google Cloud Firestore.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
