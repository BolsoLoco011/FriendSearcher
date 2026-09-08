import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  User as UserIcon, 
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  microsoftProvider,
  signInWithPopup, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  db,
  doc,
  setDoc
} from '../firebase';
import { AuthorizedEmail, SchoolSettings } from '../types';
import { validateSchoolEmail, checkSchoolEmailAuthorizationAsync } from '../utils/schoolAuth';

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
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [city, setCity] = useState('Buenos Aires');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign up with Email + Password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa un correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Check school whitelist before proceeding with email register
    const validation = await checkSchoolEmailAuthorizationAsync(email, whitelist, schoolSettings);
    if (!validation.isAllowed) {
      setErrorMsg(validation.reason || 'Este correo no está autorizado en el padrón escolar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName: name.trim() });

      // Create initial stub in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: name.trim(),
        email: user.email,
        city: city.trim() || '',
        isAdmin: validation.isAdmin || false,
        role: validation.isAdmin ? 'admin' : 'user',
        profileCompleted: false,
        createdAt: new Date().toISOString()
      }, { merge: true });

      onSuccess?.();
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errCode = (err as { code?: string })?.code || '';
      if (errCode === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Prueba iniciando sesión.');
        setTab('login');
      } else if (errCode === 'auth/invalid-email') {
        setErrorMsg('El formato del correo electrónico no es válido.');
      } else if (errCode === 'auth/weak-password') {
        setErrorMsg('La contraseña es muy débil.');
      } else {
        setErrorMsg('No se pudo completar el registro. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Email + Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // School whitelist check
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings);
      if (!validation.isAllowed) {
        await signOut(auth);
        setErrorMsg(validation.reason || 'Tu correo no está autorizado en el padrón de la escuela.');
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errCode = (err as { code?: string })?.code || '';
      if (errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else if (errCode === 'auth/invalid-email') {
        setErrorMsg('El correo ingresado no es válido.');
      } else {
        setErrorMsg('Error al iniciar sesión. Verifica tus datos o usa Google/Microsoft.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // School whitelist validation
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
        setErrorMsg('No se pudo iniciar con Google. Puedes intentar con Microsoft o correo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Microsoft (Office 365 / School accounts)
  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;

      // School whitelist validation
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

  // Sign in anonymously (Quick guest)
  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInAnonymously(auth);
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Anonymous error:', err);
      setErrorMsg('Error al ingresar como invitado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      
      {/* Brand Top Pill */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-bold shadow-xs">
          <Lock className="w-3.5 h-3.5 text-sky-500" />
          <span>Acceso Privado & Registro Requerido</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div 
        id="auth-wall-card"
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Card Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-sky-50/50 to-white border-b border-slate-100 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-200 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bienvenido a FriendSearcher
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Para ver la página, perfiles reales y actividades, debes registrarte o iniciar sesión.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 mx-6 mt-5 rounded-2xl border">
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrarme</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Ya tengo cuenta</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 pt-5">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'register' ? (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Buenos Aires, Córdoba..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Crear cuenta y entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social or Quick login options */}
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="relative flex items-center justify-center">
              <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                o acceder con
              </span>
            </div>

            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-400"
            >
              {/* Microsoft Official 4-color grid logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span>Continuar con Microsoft (Escolar)</span>
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            <button
              type="button"
              onClick={handleAnonymousSignIn}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Entrar como invitado temporal</span>
            </button>
          </div>

          {/* Trust badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Datos protegidos en Google Cloud Firestore</span>
          </div>

        </div>

      </div>
    </div>
  );
};
