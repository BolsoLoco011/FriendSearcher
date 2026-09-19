import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  User as UserIcon, 
  AlertCircle, 
  Loader2, 
  GraduationCap,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  microsoftProvider,
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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

/**
 * Normalizes an input username or email into an internal email format
 * for Firebase Authentication (which requires an email format).
 */
function normalizeUsernameToEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Alphanumeric clean-up for safe local email
  const safeUsername = trimmed.replace(/[^a-z0-9._-]/g, '');
  return `${safeUsername || 'usuario'}@friendsearcher.local`;
}

export const AuthWall: React.FC<AuthWallProps> = ({ 
  onSuccess,
  whitelist = [],
  schoolSettings = { enforceWhitelist: true } as SchoolSettings
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'credentials'>('google');
  const [credMode, setCredMode] = useState<'login' | 'register'>('login');
  
  // Credentials form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [realName, setRealName] = useState('');
  const [gradeOrClass, setGradeOrClass] = useState('');
  const [schoolCodeInput, setSchoolCodeInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMicrosoftOption, setShowMicrosoftOption] = useState(false);

  const isAutoApproveEnabled = schoolSettings?.autoApproveWithSchoolCode ?? SCHOOL_CONFIG.defaultAutoApproveWithSchoolCode;
  const activeSchoolCode = (schoolSettings?.schoolCode || SCHOOL_CONFIG.defaultSchoolCode).trim().toLowerCase();

  // 1. Sign in with Google (Recommended)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // School whitelist & domain validation
      const validation = await checkSchoolEmailAuthorizationAsync(user.email, whitelist, schoolSettings, user.uid);
      
      if (!validation.isAllowed) {
        // If not already authorized, create/update pending user profile doc
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
        setErrorMsg('No se pudo conectar con Google. Por favor revisa tu conexión o intenta con usuario y contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign in with Username/Password
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const emailToUse = normalizeUsernameToEmail(identifier);
      const result = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = result.user;

      if (isDevAutoLoginEnabled()) {
        setDevExplicitlyLoggedOut(false);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Email/Password Sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMsg('Usuario o contraseña incorrectos. Si aún no tienes cuenta, haz clic en "Crear cuenta".');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('El acceso con contraseña aún no está activado en Firebase Console. Por favor ingresa con Google.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Error de conexión con Firebase (network-request-failed). Verifica que "Email/Password" esté habilitado y el dominio esté autorizado en Firebase Console, o ingresa con Google.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Demasiados intentos fallidos. Por favor espera unos momentos antes de reintentar.');
      } else {
        setErrorMsg('Error al iniciar sesión. Verifica tus datos o ingresa con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Register with Username/Password
  const handleCredentialsRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || cleanId.length < 3) {
      setErrorMsg('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!realName.trim()) {
      setErrorMsg('Por favor ingresa tu Nombre y Apellido real.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const emailToUse = normalizeUsernameToEmail(cleanId);
      const res = await createUserWithEmailAndPassword(auth, emailToUse, password);
      const user = res.user;

      await updateProfile(user, {
        displayName: realName.trim()
      });

      const now = new Date().toISOString();
      let isApproved = false;
      let usedCode = false;

      // Check if school code auto-approval applies
      if (isAutoApproveEnabled && schoolCodeInput.trim()) {
        if (schoolCodeInput.trim().toLowerCase() === activeSchoolCode) {
          isApproved = true;
          usedCode = true;
        } else {
          // Wrong code entered, notify but allow registration to queue
          setErrorMsg('Código escolar no coincide. Tu cuenta fue creada en la cola de aprobación.');
        }
      }

      // Check if already in whitelist
      const validation = await checkSchoolEmailAuthorizationAsync(emailToUse, whitelist, schoolSettings, user.uid);
      if (validation.isAllowed) {
        isApproved = true;
      }

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: emailToUse,
        name: realName.trim(),
        realName: realName.trim(),
        gradeOrClass: gradeOrClass.trim() || 'Alumno',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        approvalStatus: isApproved ? 'approved' : 'pending',
        schoolCodeUsed: usedCode,
        requestedAt: now,
        approvedAt: isApproved ? now : null,
        approvedBy: usedCode ? 'registration_school_code' : (isApproved ? 'whitelist' : null),
        updatedAt: now,
        createdAt: now,
      }, { merge: true });

      if (isApproved && emailToUse) {
        const safeId = emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'authorized_emails', safeId), {
          id: safeId,
          email: emailToUse,
          role: 'user',
          notes: usedCode ? 'Auto-aprobado con código escolar al registrarse' : 'Aprobado en registro',
          createdAt: now,
        }, { merge: true });
      }

      if (isDevAutoLoginEnabled()) {
        setDevExplicitlyLoggedOut(false);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Registration error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('Ese usuario ya existe. Prueba iniciar sesión o elige otro nombre de usuario.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('El registro con usuario y contraseña requiere habilitar "Email/Password" en Firebase Console. Por ahora puedes entrar con Google.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Error de conexión con Firebase (network-request-failed). Verifica que el proveedor "Email/Password" esté habilitado en Firebase Console y tu navegador no bloquee la conexión, o ingresa con Google.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
      } else {
        setErrorMsg(err?.message || 'Error al registrar la cuenta. Intenta con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Microsoft Sign-in (Preserved with accurate diagnostics)
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
          approvalStatus: 'pending',
          requestedAt: now,
          updatedAt: now,
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
        setErrorMsg('El proveedor de Microsoft aún no está activado en la consola de Firebase. Por favor ingresa con Google o Usuario y Contraseña.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de Microsoft fue cerrada.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Tu navegador bloqueó la ventana emergente de Microsoft. Permite popups o usa Google.');
      } else {
        setErrorMsg('No se pudo conectar con Microsoft. Te recomendamos iniciar con Google o Usuario y Contraseña.');
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('google'); setErrorMsg(null); }}
            className={`py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              authMode === 'google' 
                ? 'bg-white text-sky-700 border-b-2 border-sky-500 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Con Google</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('credentials'); setErrorMsg(null); }}
            className={`py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              authMode === 'credentials' 
                ? 'bg-white text-sky-700 border-b-2 border-sky-500 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-sky-600" />
            <span>Usuario y Clave</span>
          </button>
        </div>

        {/* Action Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE SIGN-IN */}
          {authMode === 'google' && (
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

              <div className="pt-2 text-[11px] text-slate-500">
                ¿No tienes cuenta de Google? Puedes usar la pestaña <strong>"Usuario y Clave"</strong> arriba.
              </div>
            </div>
          )}

          {/* TAB 2: USERNAME & PASSWORD */}
          {authMode === 'credentials' && (
            <div className="space-y-4">
              {/* Login / Register Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setCredMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    credMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setCredMode('register'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    credMode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {credMode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleCredentialsLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de Usuario o Correo
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="tu_usuario o tu@correo.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
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
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <LogIn className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleCredentialsRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre y Apellido Real
                    </label>
                    <input
                      type="text"
                      required
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="Ej: Marcos Rodríguez"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Curso / Clase
                      </label>
                      <input
                        type="text"
                        value={gradeOrClass}
                        onChange={(e) => setGradeOrClass(e.target.value)}
                        placeholder="Ej: 3ro B"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Usuario deseado
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="marcos12"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contraseña (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
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

                  {/* School Code Fast-Track */}
                  {isAutoApproveEnabled && (
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                      <label className="block text-[11px] font-bold text-sky-950">
                        Código Escolar (Opcional - Para entrar ya)
                      </label>
                      <input
                        type="text"
                        value={schoolCodeInput}
                        onChange={(e) => setSchoolCodeInput(e.target.value)}
                        placeholder="Si lo tienes, ingrésalo aquí"
                        className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                      <p className="text-[10px] text-sky-700">
                        Si no tienes el código escolar, un admin podrá aprobar tu cuenta en el recreo.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Crear mi Cuenta</span>
                        <UserPlus className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

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
