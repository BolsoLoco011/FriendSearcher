import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  User as UserIcon, 
  AlertCircle,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  microsoftProvider,
  signInWithPopup, 
  signOut
} from '../firebase';
import { AuthorizedEmail, SchoolSettings } from '../types';
import { checkSchoolEmailAuthorizationAsync } from '../utils/schoolAuth';

interface AuthWallProps {
  onSuccess?: () => void;
  whitelist?: AuthorizedEmail[];
  schoolSettings?: SchoolSettings;
}

export const AuthWall: React.FC<AuthWallProps> = ({ 
  onSuccess,
  whitelist = [],
  schoolSettings = { enforceWhitelist: true }
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign in with Microsoft (Office 365 / School accounts @elbiofernandez.edu.uy)
  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;

      // School whitelist & domain validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings);
      if (!validation.isAllowed) {
        await signOut(auth);
        setErrorMsg(validation.reason || 'Tu cuenta de Microsoft no figura en el padrón escolar autorizado.');
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      console.error('Microsoft Sign-in error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('La ventana de Microsoft fue cerrada. Puedes intentarlo de nuevo.');
      } else {
        setErrorMsg('No se pudo conectar con Microsoft. Verifica tu cuenta o inicia con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google (Administrators and authorized accounts)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // School whitelist & domain validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings);
      if (!validation.isAllowed) {
        await signOut(auth);
        setErrorMsg(validation.reason || 'Tu cuenta de Google no figura en el padrón escolar autorizado.');
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('La ventana de Google fue cerrada. Puedes intentarlo de nuevo.');
      } else {
        setErrorMsg('No se pudo iniciar con Google. Intenta con tu cuenta escolar de Microsoft.');
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
          <span>Acceso Privado Institucional</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div 
        id="auth-wall-card"
        className="w-full max-w-md bg-sky-50 border-2 border-sky-300 rounded-3xl shadow-2xl shadow-sky-300/60 overflow-hidden"
      >
        {/* Card Header Banner */}
        <div className="p-6 sm:p-8 bg-sky-100 border-b border-sky-200 text-center">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-3">
            <img 
              src="/logo.svg" 
              alt="FriendSearcher Logo" 
              className="w-20 h-20 object-contain drop-shadow-md hover:scale-105 transition-transform" 
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-sky-950 tracking-tight">
            FriendSearcher
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 mt-1">
            Colegio y Liceo Elbio Fernández
          </p>
          <p className="text-xs sm:text-sm text-sky-800 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
            Acceso exclusivo para alumnos y docentes. Inicia sesión con tu cuenta institucional para conectar con amigos, actividades y juegos.
          </p>
        </div>

        {/* Action Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action: Microsoft School Account */}
          <button
            id="btn-microsoft-auth-wall"
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-sky-400 bg-white hover:bg-sky-50 text-slate-900 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
            ) : (
              <>
                {/* Microsoft Official 4-color grid logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <div className="text-left">
                  <div className="leading-tight">Ingresar con Microsoft</div>
                  <div className="text-[10px] text-sky-700 font-semibold">@elbiofernandez.edu.uy</div>
                </div>
              </>
            )}
          </button>

          {/* Secondary Action: Google (Admins) */}
          <button
            id="btn-google-auth-wall"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-400 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google (Administrador)</span>
              </>
            )}
          </button>

          {/* Trust badge */}
          <div className="mt-6 pt-4 border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-[11px] text-sky-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Validación institucional automática (@elbiofernandez.edu.uy)</span>
          </div>

        </div>

      </div>
    </div>
  );
};
