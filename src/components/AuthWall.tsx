import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ChevronDown
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  microsoftProvider,
  signInWithPopup, 
  db, 
  doc, 
  setDoc 
} from '../firebase';
import { AuthorizedEmail, SchoolSettings } from '../types';
import { checkSchoolEmailAuthorizationAsync } from '../utils/schoolAuth';
import { isDevAutoLoginEnabled, setDevExplicitlyLoggedOut } from '../utils/devAuth';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

interface AuthWallProps {
  onSuccess?: () => void;
  whitelist?: AuthorizedEmail[];
  schoolSettings?: SchoolSettings;
}

export const AuthWall: React.FC<AuthWallProps> = ({ 
  onSuccess,
  whitelist = [],
  schoolSettings = { enforceWhitelist: true } as SchoolSettings
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMicrosoftOption, setShowMicrosoftOption] = useState(false);

  // 1. Sign in with Google (Primary and recommended)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // School whitelist & domain validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings, user.uid);
      
      if (!validation.isAllowed) {
        // If not already authorized, create/update pending user profile doc with complete default fields
        const now = new Date().toISOString();
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Alumno/a',
          realName: user.displayName || '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          approvalStatus: 'pending',
          requestedAt: now,
          updatedAt: now,
          traits: ['AMISTAD', 'COMPAÑERISMO'],
          city: 'Montevideo',
          occupation: 'Estudiante',
          bio: 'Nuevo integrante del colegio en FriendSearcher.',
          favoriteFood: 'Milanesas con papas fritas',
          favoriteMemeStyle: 'Memes de risa',
          age: 12,
          matchScore: 85,
          highlightCategory: 'caracteristicas',
          isConnected: false,
        }, { merge: true });
      }

      if (isDevAutoLoginEnabled()) {
        setDevExplicitlyLoggedOut(false);
      }
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('La ventana de Google fue cerrada. Puedes intentarlo de nuevo.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Tu navegador bloqueó la ventana emergente de Google. Por favor permite popups.');
      } else {
        setErrorMsg('No se pudo conectar con Google. Por favor revisa tu conexión e inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Microsoft Sign-in (Preserved with accurate diagnostics)
  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;

      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings, user.uid);
      if (!validation.isAllowed) {
        const now = new Date().toISOString();
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Alumno/a',
          realName: user.displayName || '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          approvalStatus: 'pending',
          requestedAt: now,
          updatedAt: now,
          traits: ['AMISTAD', 'COMPAÑERISMO'],
          city: 'Montevideo',
          occupation: 'Estudiante',
          bio: 'Nuevo integrante del colegio en FriendSearcher.',
          favoriteFood: 'Milanesas con papas fritas',
          favoriteMemeStyle: 'Memes de risa',
          age: 12,
          matchScore: 85,
          highlightCategory: 'caracteristicas',
          isConnected: false,
        }, { merge: true });
      }

      if (isDevAutoLoginEnabled()) {
        setDevExplicitlyLoggedOut(false);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Microsoft Sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setErrorMsg('El proveedor de Microsoft aún no está activado en la consola de Firebase. Por favor ingresa con Google.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de Microsoft fue cerrada.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Tu navegador bloqueó la ventana emergente de Microsoft. Permite popups o usa Google.');
      } else {
        setErrorMsg('No se pudo conectar con Microsoft. Te recomendamos iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-200 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      
      {/* Brand Top Pill */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-400 text-sky-950 text-xs font-black shadow-xs">
          <img src="/logo.svg" alt="Logo" className="w-4 h-4 object-contain" />
          <span>Acceso Escolar Institucional</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div 
        id="auth-wall-card"
        className="w-full max-w-md bg-white border-2 border-sky-300 rounded-3xl shadow-2xl shadow-sky-300/60 overflow-hidden"
      >
        {/* Card Header Banner */}
        <div className="p-6 sm:p-8 bg-sky-50 border-b border-sky-200 text-center">
          <div className="w-18 h-18 mx-auto flex items-center justify-center mb-3">
            <img 
              src="/logo.svg" 
              alt="FriendSearcher Logo" 
              className="w-18 h-18 object-contain drop-shadow-md hover:scale-105 transition-transform" 
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            FriendSearcher
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 mt-1">
            {schoolSettings?.schoolName || SCHOOL_CONFIG.schoolName}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
            Conecta con amigos, actividades y grupos de tu colegio.
          </p>
        </div>

        {/* Action Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* GOOGLE SIGN-IN */}
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingresa con tu cuenta de Google. Funciona en cualquier navegador (Brave, Chrome, Safari o celular).
            </p>

            <button
              id="btn-google-auth-wall"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible Microsoft Option */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMicrosoftOption(!showMicrosoftOption)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Otras opciones (Microsoft Escolar)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMicrosoftOption ? 'rotate-180' : ''}`} />
            </button>

            {showMicrosoftOption && (
              <div className="mt-3 space-y-2">
                <button
                  id="btn-microsoft-auth-wall"
                  type="button"
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  <span>Ingresar con Microsoft (@elbiofernandez.edu.uy)</span>
                </button>
              </div>
            )}
          </div>

          {/* Dev-only Quick Login Button */}
          {isDevAutoLoginEnabled() && (
            <button
              id="btn-dev-quick-login"
              type="button"
              onClick={() => {
                setDevExplicitlyLoggedOut(false);
                onSuccess?.();
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Entrar como j.ipar@elbiofernandez.edu.uy (Dev Admin)</span>
            </button>
          )}

          {/* Trust badge */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Verificación escolar institucional activa</span>
          </div>

        </div>

      </div>
    </div>
  );
};
