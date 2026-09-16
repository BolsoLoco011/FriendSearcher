import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { User, db, doc, onSnapshot, setDoc } from '../firebase';
import { FriendProfile, SchoolSettings } from '../types';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

interface PendingApprovalScreenProps {
  user: User;
  userProfile?: FriendProfile | null;
  schoolSettings?: SchoolSettings;
  onApproved?: () => void;
  onSignOut: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  userProfile,
  schoolSettings,
  onApproved,
  onSignOut,
}) => {
  const [code, setCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const contactName = schoolSettings?.adminContactName || SCHOOL_CONFIG.adminContactName;
  const isAutoApproveEnabled = schoolSettings?.autoApproveWithSchoolCode ?? SCHOOL_CONFIG.defaultAutoApproveWithSchoolCode;
  const activeSchoolCode = (schoolSettings?.schoolCode || SCHOOL_CONFIG.defaultSchoolCode).trim().toLowerCase();

  // Real-time listener: As soon as the admin approves the user in Firestore, auto-advance
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.approvalStatus === 'approved') {
          setSuccessMsg('¡Tu cuenta ha sido aprobada por el administrador!');
          setTimeout(() => {
            onApproved?.();
          }, 600);
        }
      }
    });

    return () => unsub();
  }, [user.uid, onApproved]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isAutoApproveEnabled) {
      setErrorMsg(SCHOOL_CONFIG.messages.schoolCodeDisabledNotice);
      return;
    }

    const cleanInput = code.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMsg('Por favor ingresa el código escolar.');
      return;
    }

    if (cleanInput !== activeSchoolCode) {
      setErrorMsg(SCHOOL_CONFIG.messages.schoolCodeError);
      return;
    }

    setSubmittingCode(true);
    try {
      const now = new Date().toISOString();
      const userDocRef = doc(db, 'users', user.uid);

      // 1. Update user profile to approved status
      await setDoc(userDocRef, {
        approvalStatus: 'approved',
        schoolCodeUsed: true,
        approvedAt: now,
        approvedBy: 'school_code_auto_approval',
        updatedAt: now,
      }, { merge: true });

      // 2. Add email to authorized_emails whitelist
      if (user.email) {
        const safeId = user.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'authorized_emails', safeId), {
          id: safeId,
          email: user.email.toLowerCase().trim(),
          role: 'user',
          notes: 'Auto-aprobado con código escolar',
          createdAt: now,
        }, { merge: true });
      }

      setSuccessMsg(SCHOOL_CONFIG.messages.schoolCodeSuccess);
      setTimeout(() => {
        onApproved?.();
      }, 700);
    } catch (err) {
      console.error('Error auto-approving with school code:', err);
      setErrorMsg('Ocurrió un error al validar el código. Intenta nuevamente.');
    } finally {
      setSubmittingCode(false);
    }
  };

  const displayName = userProfile?.name || userProfile?.realName || user.displayName || user.email?.split('@')[0] || 'Alumno/a';

  return (
    <div className="min-h-screen bg-sky-200 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      
      {/* Brand Top Pill */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-400 text-sky-950 text-xs font-black shadow-xs">
          <img src="/logo.svg" alt="Logo" className="w-4 h-4 object-contain" />
          <span>{SCHOOL_CONFIG.schoolName}</span>
        </div>
      </div>

      {/* Main Card */}
      <div 
        id="pending-approval-card"
        className="w-full max-w-md bg-white border-2 border-sky-300 rounded-3xl shadow-2xl shadow-sky-300/60 overflow-hidden"
      >
        {/* Header Banner */}
        <div className="p-6 sm:p-7 bg-sky-50 border-b border-sky-100 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center mb-3 shadow-inner">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {SCHOOL_CONFIG.messages.pendingTitle}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {SCHOOL_CONFIG.messages.pendingSubtitle}
          </p>

          {/* User Info Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-slate-700 text-xs font-medium shadow-2xs">
            {user.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-sky-600" />
            )}
            <span className="font-bold text-slate-900">{displayName}</span>
            {userProfile?.gradeOrClass && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">
                {userProfile.gradeOrClass}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Custom Description Message */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p>
              {SCHOOL_CONFIG.messages.pendingDescription(contactName)}
            </p>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-[11px] pt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{SCHOOL_CONFIG.messages.waitingBadge}</span>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* School Code Fast-Track Section */}
          {isAutoApproveEnabled && (
            <form onSubmit={handleVerifyCode} className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-xs">
                <KeyRound className="w-4 h-4 text-sky-600" />
                <span>{SCHOOL_CONFIG.messages.schoolCodeSectionTitle}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                {SCHOOL_CONFIG.messages.schoolCodeSectionDescription}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={SCHOOL_CONFIG.messages.schoolCodePlaceholder}
                  disabled={submittingCode}
                  className="w-full flex-1 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={submittingCode || !code.trim()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{SCHOOL_CONFIG.messages.schoolCodeButton}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Action Footer: Logout */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{SCHOOL_CONFIG.messages.logoutButton}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-sky-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verificación de identidad escolar activa</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
