import React, { useState } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  Sliders, 
  Mail, 
  FileText,
  AlertCircle,
  Edit3,
  Save,
  Utensils
} from 'lucide-react';
import { db, doc, deleteDoc, setDoc, updateDoc, collection, User } from '../firebase';
import { FriendProfile, MemeItem, CookingItem, EventItem, GroupItem, GymItem, AuthorizedEmail, SchoolSettings } from '../types';
import { INITIAL_FRIENDS } from '../data/mockData';
import { unifyDuplicateProfiles } from '../utils/unifyProfiles';
import { isUserAdmin, canRevokeAdmin, DEFAULT_ADMIN_EMAIL, TESTING_ADMIN_EMAIL, isTestingEnvironment } from '../config/admin';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirestoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  friends: FriendProfile[];
  memes: MemeItem[];
  cooking: CookingItem[];
  events: EventItem[];
  groups: GroupItem[];
  gym?: GymItem[];
  authorizedEmails: AuthorizedEmail[];
  schoolSettings: SchoolSettings;
  onRefresh: () => void;
  isSyncing: boolean;
  onSaveSchoolSettings?: (settings: SchoolSettings) => Promise<void>;
  onAddAuthorizedEmail?: (email: string, role: 'admin' | 'user', notes: string) => Promise<void>;
  onDeleteAuthorizedEmail?: (id: string) => Promise<void>;
  onUpdateUserAdminRole?: (userId: string, newIsAdmin: boolean, userEmail?: string) => Promise<void>;
  onUpdateUserProfile?: (userId: string, data: Partial<FriendProfile>) => Promise<void>;
  initialEditingUserId?: string | null;
}

type TabCollection = 'users' | 'authorized_emails' | 'school_settings' | 'memes' | 'cooking' | 'events' | 'groups' | 'gym';

export const FirestoreManagerModal: React.FC<FirestoreManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  friends,
  memes,
  cooking,
  events,
  groups,
  gym = [],
  authorizedEmails,
  schoolSettings,
  onRefresh,
  isSyncing,
  onSaveSchoolSettings,
  onAddAuthorizedEmail,
  onDeleteAuthorizedEmail,
  onUpdateUserAdminRole,
  onUpdateUserProfile,
  initialEditingUserId,
}) => {
  const [selectedCol, setSelectedCol] = useState<TabCollection>('users');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // User editing states
  const [editingUser, setEditingUser] = useState<FriendProfile | null>(null);
  const [editingTraitsText, setEditingTraitsText] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Auto-select user for editing if initialEditingUserId was passed
  React.useEffect(() => {
    if (isOpen && initialEditingUserId) {
      setSelectedCol('users');
      const found = friends.find(f => f.id === initialEditingUserId);
      if (found) {
        setEditingUser(found);
        setEditingTraitsText(found.traits ? found.traits.join(', ') : '');
        setSelectedDocPreview(found);
      }
    }
  }, [isOpen, initialEditingUserId, friends]);

  // Form states for adding authorized email
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newNotes, setNewNotes] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Settings form states
  const [localSettings, setLocalSettings] = useState<SchoolSettings>(schoolSettings);

  // Sync localSettings if schoolSettings changes
  React.useEffect(() => {
    setLocalSettings(schoolSettings);
  }, [schoolSettings]);

  if (!isOpen) return null;

  const currentAdminStatus = isUserAdmin({
    email: currentUser?.email,
    databaseAdmins: authorizedEmails.filter(a => a.role === 'admin').map(a => a.email)
  });

  if (!currentAdminStatus) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md bg-white border border-rose-200 rounded-3xl shadow-2xl p-6 text-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Acceso Restringido</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              El panel de gestión de base de datos y control de roles escolares está reservado exclusivamente para Administradores autorizados.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 border border-slate-200 text-left">
            <div className="font-semibold text-slate-700 mb-0.5">Admin principal escolar:</div>
            <code className="text-sky-600 font-mono font-bold">{DEFAULT_ADMIN_EMAIL}</code>
            {isTestingEnvironment() && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                <div className="font-semibold text-amber-700 mb-0.5">Admin de pruebas (friendsearchertesting.ai.studio):</div>
                <code className="text-amber-600 font-mono font-bold">{TESTING_ADMIN_EMAIL}</code>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Entendido, volver
          </button>
        </div>
      </div>
    );
  }

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDelete = async (col: string, id: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el documento "${id}" de Firestore?`)) {
      return;
    }

    setDeletingId(id);
    try {
      if (col === 'authorized_emails' && onDeleteAuthorizedEmail) {
        await onDeleteAuthorizedEmail(id);
      } else {
        await deleteDoc(doc(db, col, id));
      }
      showFeedback(`Documento "${id}" eliminado de Firestore.`);
    } catch (err) {
      console.error('Error deleting from Firestore:', err);
      showFeedback(`Error al eliminar: ${err instanceof Error ? err.message : 'Desconocido'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAdmin = async (user: FriendProfile) => {
    if (user.email && !canRevokeAdmin(user.email)) {
      showFeedback('No es posible revocar los permisos del Administrador Principal predeterminado por código.');
      return;
    }

    const newStatus = !user.isAdmin;
    const confirmMsg = newStatus 
      ? `¿Deseas otorgar permisos de Administrador a "${user.name}" (${user.email || 'sin correo'})? Podrá gestionar la base de datos y roles.`
      : `¿Deseas revocar los permisos de Administrador a "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      if (onUpdateUserAdminRole) {
        await onUpdateUserAdminRole(user.id, newStatus, user.email);
      } else {
        await updateDoc(doc(db, 'users', user.id), {
          isAdmin: newStatus,
          role: newStatus ? 'admin' : 'user'
        });
      }
      showFeedback(`Rol actualizado: "${user.name}" ahora es ${newStatus ? 'ADMINISTRADOR' : 'Usuario estándar'}.`);
    } catch (err) {
      console.error('Error toggling admin role:', err);
      showFeedback('Error al actualizar el rol de administrador en Firestore.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showFeedback('Ingresa una dirección de correo válida.');
      return;
    }

    try {
      if (onAddAuthorizedEmail) {
        await onAddAuthorizedEmail(newEmail.trim(), newRole, newNotes.trim());
      } else {
        const cleanEmail = newEmail.toLowerCase().trim();
        const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'authorized_emails', safeId), {
          id: safeId,
          email: cleanEmail,
          role: newRole,
          notes: newNotes.trim(),
          addedBy: currentUser?.email || 'admin',
          createdAt: new Date().toISOString()
        });
      }
      setNewEmail('');
      setNewNotes('');
      showFeedback(`Correo "${newEmail.toLowerCase().trim()}" añadido al padrón escolar.`);
    } catch (err) {
      console.error('Error adding authorized email:', err);
      showFeedback('Error al guardar el correo en Firestore.');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkEmails.trim()) return;

    const rawList = bulkEmails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@') && e.length > 4);

    if (rawList.length === 0) {
      showFeedback('No se detectaron correos electrónicos válidos en el texto.');
      return;
    }

    try {
      for (const email of rawList) {
        const safeId = email.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'authorized_emails', safeId), {
          id: safeId,
          email: email,
          role: 'user',
          notes: 'Carga masiva escolar',
          addedBy: currentUser?.email || 'admin',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      setBulkEmails('');
      setShowBulkInput(false);
      showFeedback(`Se importaron ${rawList.length} correos al padrón escolar con éxito.`);
    } catch (err) {
      console.error('Error bulk adding:', err);
      showFeedback('Hubo un inconveniente en la carga masiva.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (onSaveSchoolSettings) {
        await onSaveSchoolSettings(localSettings);
      } else {
        await setDoc(doc(db, 'settings', 'school_config'), {
          ...localSettings,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      showFeedback('Configuración escolar guardada correctamente en Firestore.');
    } catch (err) {
      console.error('Error saving settings:', err);
      showFeedback('Error al guardar las políticas escolares.');
    }
  };

  const handleUnify = async () => {
    if (!currentUser) {
      showFeedback('Debes estar autenticado para unificar perfiles.');
      return;
    }
    try {
      const res = await unifyDuplicateProfiles(db, currentUser.email, currentUser.uid, friends);
      if (res.unified) {
        showFeedback(res.message || 'Perfiles unificados correctamente en Firestore.');
        onRefresh();
      } else {
        showFeedback(res.message || 'No se detectaron perfiles duplicados pendientes.');
      }
    } catch (err) {
      console.error('Error unificando:', err);
      showFeedback('Error al intentar unificar los perfiles.');
    }
  };

  const handleSyncCodeProfiles = async () => {
    try {
      for (const f of INITIAL_FRIENDS) {
        await setDoc(doc(db, 'users', f.id), f, { merge: true });
      }
      showFeedback(`Se sincronizaron ${INITIAL_FRIENDS.length} perfiles del código a Firestore.`);
      onRefresh();
    } catch (err: any) {
      console.error('Error syncing code profiles:', err);
      showFeedback('Error al sincronizar perfiles de código.');
    }
  };

  const handleOpenEditUser = (user: FriendProfile) => {
    setEditingUser({ ...user });
    setEditingTraitsText(Array.isArray(user.traits) ? user.traits.join(', ') : '');
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const parsedTraits = editingTraitsText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const cleanData: Partial<FriendProfile> = {
        name: editingUser.name.trim(),
        favoriteFood: editingUser.favoriteFood?.trim() || '',
        favoriteMemeStyle: editingUser.favoriteMemeStyle?.trim() || '',
        city: editingUser.city?.trim() || '',
        occupation: editingUser.occupation?.trim() || '',
        age: Number(editingUser.age) || 0,
        bio: editingUser.bio?.trim() || '',
        traits: parsedTraits.length > 0 ? parsedTraits : (editingUser.traits || []),
        joinedEvent: editingUser.joinedEvent?.trim() || '',
        joinedGroup: editingUser.joinedGroup?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (onUpdateUserProfile) {
        await onUpdateUserProfile(editingUser.id, cleanData);
      } else {
        await updateDoc(doc(db, 'users', editingUser.id), cleanData);
      }

      showFeedback(`Datos de "${editingUser.name}" actualizados con éxito en Firestore (Comida: "${cleanData.favoriteFood}").`);
      if (selectedDocPreview?.id === editingUser.id) {
        setSelectedDocPreview((prev: any) => ({ ...prev, ...cleanData }));
      }
      setEditingUser(null);
      onRefresh();
    } catch (err) {
      console.error('Error al guardar datos del usuario:', err);
      showFeedback(`Error al guardar: ${err instanceof Error ? err.message : 'Desconocido'}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const getItemsForCurrentTab = () => {
    switch (selectedCol) {
      case 'users':
        return friends.map(f => ({ 
          id: f.id, 
          title: f.name, 
          subtitle: `${f.email || 'Sin correo'} • ${f.occupation} • ${f.city}`, 
          data: f 
        }));
      case 'authorized_emails':
        return authorizedEmails.map(a => ({ 
          id: a.id, 
          title: a.email, 
          subtitle: `Rol: ${a.role === 'admin' ? 'Administrador' : 'Alumno/Docente'}${a.notes ? ` • ${a.notes}` : ''}`, 
          data: a 
        }));
      case 'memes':
        return memes.map(m => ({ id: m.id, title: m.title, subtitle: `Tag: ${m.tag} • ${m.likes} votos`, data: m }));
      case 'cooking':
        return cooking.map(c => ({ id: c.id, title: c.title, subtitle: `Cocina: ${c.cuisine} • Host: ${c.hostName}`, data: c }));
      case 'events':
        return events.map(e => ({ id: e.id, title: e.title, subtitle: `${e.date} • ${e.location}`, data: e }));
      case 'groups':
        return groups.map(g => ({ id: g.id, title: g.title, subtitle: `${g.category} • ${g.membersCount} miembros`, data: g }));
      case 'gym':
        return gym.map(y => ({ id: y.id, title: y.title, subtitle: `Actividad: ${y.activity} • ${y.membersCount} personas • ${y.location}`, data: y }));
      default:
        return [];
    }
  };

  const currentItems = getItemsForCurrentTab();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="firestore-manager-modal"
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Explorar BD Firestore - Gestión y Edición de Usuarios
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Modo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                Admin: <strong className="text-slate-800">{currentUser?.email}</strong> • Edición directa de usuarios y colecciones en Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
              title="Forzar actualización desde Firestore"
            >
              <RefreshCw className={`w-4 h-4 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Collection Selector Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 overflow-x-auto bg-white">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            Vistas:
          </span>

          {/* Users with Admin Role management */}
          <button
            onClick={() => { setSelectedCol('users'); setSelectedDocPreview(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCol === 'users' ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Usuarios Firestore</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCol === 'users' ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {friends.length}
            </span>
          </button>

          {/* School Whitelist */}
          <button
            onClick={() => { setSelectedCol('authorized_emails'); setSelectedDocPreview(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCol === 'authorized_emails' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Padrón Escolar (Whitelist)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCol === 'authorized_emails' ? 'bg-white/30 text-white' : 'bg-indigo-200 text-indigo-800'}`}>
              {authorizedEmails.length}
            </span>
          </button>

          {/* School Configuration Policies */}
          <button
            onClick={() => { setSelectedCol('school_settings'); setSelectedDocPreview(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCol === 'school_settings' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Políticas Escolares</span>
          </button>

          {/* Other Firestore collections */}
          {(['memes', 'cooking', 'events', 'groups', 'gym'] as TabCollection[]).map((tab) => {
            const count = 
              tab === 'memes' ? memes.length :
              tab === 'cooking' ? cooking.length :
              tab === 'events' ? events.length :
              tab === 'groups' ? groups.length : gym.length;

            return (
              <button
                key={tab}
                onClick={() => {
                  setSelectedCol(tab);
                  setSelectedDocPreview(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCol === tab
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCol === tab ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        {selectedCol === 'school_settings' ? (
          /* SCHOOL POLICIES TAB */
          <div className="p-6 overflow-y-auto space-y-6 max-h-[500px]">
            <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Políticas de Registro y Acceso Escolar</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configura cómo la escuela controla el acceso de alumnos y docentes. Puedes exigir que estén en el padrón de correos autorizados o habilitar un dominio institucional corporativo/educativo de Microsoft o Google.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Whitelist Switch */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Filtro Estricto de Padrón (Whitelist)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Solo los correos registrados en la lista podrán registrarse o ingresar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalSettings(s => ({ ...s, enforceWhitelist: !s.enforceWhitelist }))}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      localSettings.enforceWhitelist ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                        localSettings.enforceWhitelist ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  Estado: <strong className={localSettings.enforceWhitelist ? 'text-indigo-600' : 'text-slate-600'}>
                    {localSettings.enforceWhitelist ? 'Activado (Cuentas no autorizadas son bloqueadas)' : 'Desactivado (Cualquiera puede crear cuenta)'}
                  </strong>
                </div>
              </div>

              {/* Institutional Domain Auto-Access */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <h5 className="text-xs font-bold text-slate-800">Dominio Institucional Escolar (Opcional)</h5>
                <p className="text-[11px] text-slate-500">
                  Cualquier cuenta de Microsoft o Google con este dominio podrá acceder automáticamente (ej: <code>@escuela.edu</code>).
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="@escuela.edu o @colegio.edu.ar"
                    value={localSettings.allowedDomain || ''}
                    onChange={(e) => setLocalSettings(s => ({ ...s, allowedDomain: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Políticas en Base de Datos</span>
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD TWO-COLUMN LIST & INSPECTOR */
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 flex-1 overflow-hidden min-h-[380px]">
            
            {/* Document list & Action controls */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[480px]">
              
              {/* Header inside list */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-xs font-bold text-slate-600">
                  {selectedCol === 'users' && `Usuarios registrados (${friends.length})`}
                  {selectedCol === 'authorized_emails' && `Padrón Escolar (${authorizedEmails.length})`}
                  {selectedCol !== 'users' && selectedCol !== 'authorized_emails' && (
                    <>Documentos en <code className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">/{selectedCol}</code> ({currentItems.length})</>
                  )}
                </span>

                {selectedCol === 'users' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncCodeProfiles}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Sincroniza los perfiles iniciales definidos en el código a Firestore"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                      <span>Sincronizar código a BD</span>
                    </button>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={handleUnify}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Limpia y unifica documentos duplicados del usuario preservando sus datos reales"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unificar duplicados</span>
                      </button>
                    )}
                  </div>
                )}

                {selectedCol === 'authorized_emails' && (
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showBulkInput ? 'Ocultar Carga Masiva' : 'Carga Masiva'}</span>
                  </button>
                )}
              </div>

              {/* Form to add an Authorized Email */}
              {selectedCol === 'authorized_emails' && (
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  {showBulkInput ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Pegar lista de correos (separados por coma o salto de línea):
                      </label>
                      <textarea
                        rows={3}
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        placeholder="alumno1@escuela.edu, alumno2@escuela.edu&#10;docente@escuela.edu"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleBulkAdd}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Importar correos al Padrón
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAddEmail} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                      <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Autorizar nuevo correo escolar:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          placeholder="correo@escuela.edu"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                        />
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                          className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="user">Alumno / Docente</option>
                          <option value="admin">Administrador Escolar</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Notas (ej: 4to año B / Prof. Lengua)"
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          Autorizar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Items List */}
              {currentItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No hay documentos registrados en esta sección.
                </div>
              ) : (
                currentItems.map((item) => {
                  const isUserTab = selectedCol === 'users';
                  const isAuthTab = selectedCol === 'authorized_emails';
                  const user = isUserTab ? (item.data as FriendProfile) : null;
                  const authDoc = isAuthTab ? (item.data as AuthorizedEmail) : null;
                  const isMasterAdmin = isUserTab && (
                    user?.email?.toLowerCase().trim() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
                    (isTestingEnvironment() && user?.email?.toLowerCase().trim() === TESTING_ADMIN_EMAIL.toLowerCase())
                  );

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDocPreview(item.data)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        selectedDocPreview?.id === item.id
                          ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                          : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {item.title}
                          </span>
                          
                          {/* Role Badges */}
                          {isUserTab && (
                            <>
                              {isMasterAdmin ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                                  Admin Principal (Código)
                                </span>
                              ) : user?.isAdmin ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold border border-sky-300 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-sky-600" />
                                  Admin
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                                  Usuario
                                </span>
                              )}
                            </>
                          )}

                          {isAuthTab && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                              authDoc?.role === 'admin' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}>
                              {authDoc?.role === 'admin' ? 'Admin' : 'Alumno/Docente'}
                            </span>
                          )}

                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
                            id: {item.id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                        {isUserTab && user && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-lg w-fit">
                            <Utensils className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Comida favorita: <strong className="text-amber-950 font-bold">{user.favoriteFood || 'Sin definir'}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Grant/Revoke Admin Button in Users tab */}
                        {isUserTab && user && (
                          <>
                            {isMasterAdmin ? (
                              <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-100 rounded-lg flex items-center gap-1" title="Protegido por código">
                                <Lock className="w-3 h-3 text-slate-400" />
                                Inmutable
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(user)}
                                disabled={actionLoadingId === user.id}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  user.isAdmin
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                                title={user.isAdmin ? 'Quitar privilegios de Administrador' : 'Otorgar privilegios de Administrador'}
                              >
                                {user.isAdmin ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Quitar Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Hacer Admin</span>
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )}

                        {/* Edit User Data Button in Users tab */}
                        {isUserTab && user && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                            title="Modificar datos del usuario en Firebase (comida favorita, nombre, etc.)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white" />
                            <span>Editar Usuario</span>
                          </button>
                        )}

                        {/* View JSON button */}
                        <button
                          onClick={() => setSelectedDocPreview(item.data)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all cursor-pointer"
                          title="Ver JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete document button (only if not master admin) */}
                        {!isMasterAdmin && (
                          <button
                            onClick={() => handleDelete(selectedCol, item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar de Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* JSON Inspector */}
            <div className="p-4 sm:p-6 bg-slate-900 text-slate-200 overflow-y-auto max-h-[480px] font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-slate-400 text-[11px] font-semibold truncate">
                  {selectedDocPreview ? `Documento: ${selectedDocPreview.id || 'Seleccionado'}` : 'Inspector de Documentos Firestore'}
                </span>
                {selectedDocPreview && (
                  <span className="text-emerald-400 text-[10px] font-bold shrink-0">
                    Documento en vivo
                  </span>
                )}
              </div>

              {/* User quick preview banner with direct edit button */}
              {selectedDocPreview && (selectedCol === 'users' || selectedDocPreview.favoriteFood !== undefined) && (
                <div className="mb-4 p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 font-sans space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{selectedDocPreview.name}</span>
                        {selectedDocPreview.isAdmin && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">ADMIN</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">{selectedDocPreview.email || selectedDocPreview.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(selectedDocPreview)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modificar Datos de este Usuario</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Comida Favorita:</span>
                      <p className="text-white font-bold mt-0.5 text-xs truncate">
                        {selectedDocPreview.favoriteFood || <span className="text-slate-500 italic">No especificada</span>}
                      </p>
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-wider">Estilo de Memes:</span>
                      <p className="text-white font-medium mt-0.5 text-xs truncate">
                        {selectedDocPreview.favoriteMemeStyle || <span className="text-slate-500 italic">No especificado</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDocPreview ? (
                <pre className="whitespace-pre-wrap break-all text-emerald-300/90 text-[11px] leading-relaxed">
                  {JSON.stringify(selectedDocPreview, null, 2)}
                </pre>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-center space-y-2">
                  <Database className="w-8 h-8 text-slate-700" />
                  <p className="text-xs max-w-xs">
                    Haz clic en cualquier usuario, correo escolar o documento para ver sus campos en la base de datos en tiempo real.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Modal para Editar Datos de Usuario en Firestore */}
        {editingUser && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setEditingUser(null)}
          >
            <div 
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto p-5 sm:p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Editar Usuario en Firestore</h3>
                    <p className="text-[11px] text-slate-400 font-mono">ID: {editingUser.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
                {/* Email (identificador) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Correo Electrónico (Asociado a la cuenta):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.email || 'Sin correo asociado'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  />
                </div>

                {/* Comida Favorita - Destaque especial solicitado por el usuario */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-amber-900 block">
                      Comida Favorita (favoriteFood):
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 font-bold">
                      Campo Clave
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Asado con ensalada, Pizza casera, Milanesas con papas fritas..."
                    value={editingUser.favoriteFood || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, favoriteFood: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-500 text-slate-800 font-bold"
                  />
                  
                  {/* Sugerencias Rápidas de Comida */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-amber-800 font-bold w-full">Opciones rápidas (haz clic para seleccionar al instante):</span>
                    {['Milanesas con papas fritas', 'Asado criollo con ensalada', 'Pizza artesanal', 'Fideos con tuco', 'Smash Burgers', 'Sushi & Comida asiática'].map(food => (
                      <button
                        type="button"
                        key={food}
                        onClick={() => setEditingUser({ ...editingUser, favoriteFood: food })}
                        className={`px-2 py-0.5 text-[10px] rounded-lg border transition-all cursor-pointer ${
                          editingUser.favoriteFood === food
                            ? 'bg-amber-600 text-white border-amber-700 font-black shadow-2xs'
                            : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100 font-medium'
                        }`}
                      >
                        {food}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-700 leading-tight pt-0.5">
                    Este valor se guardará persistentemente en el documento <code>users/{editingUser.id}</code> y no volverá a revertirse.
                  </p>
                </div>

                {/* Estilo de Memes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Estilo de Memes Favorito (favoriteMemeStyle):
                  </label>
                  <input
                    type="text"
                    value={editingUser.favoriteMemeStyle || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, favoriteMemeStyle: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                {/* Ciudad y Ocupación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Ciudad / Ubicación:
                    </label>
                    <input
                      type="text"
                      value={editingUser.city || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Ocupación / Rol escolar:
                    </label>
                    <input
                      type="text"
                      value={editingUser.occupation || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, occupation: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Edad y Evento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Edad:
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={editingUser.age || 18}
                      onChange={(e) => setEditingUser({ ...editingUser, age: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Evento Escolar:
                    </label>
                    <input
                      type="text"
                      value={editingUser.joinedEvent || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, joinedEvent: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Intereses / Rasgos */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Intereses y Etiquetas (separadas por coma):
                  </label>
                  <input
                    type="text"
                    value={editingTraitsText}
                    onChange={(e) => setEditingTraitsText(e.target.value)}
                    placeholder="VIDEOJUEGOS, DEPORTES, PROGRAMACIÓN, MÚSICA"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                {/* Biografía */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Biografía:
                  </label>
                  <textarea
                    rows={2}
                    value={editingUser.bio || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800 resize-none"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    disabled={isSavingUser}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingUser ? 'Guardando en Firestore...' : 'Guardar Cambios en Firestore'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Los cambios de roles y padrón escolar se aplican inmediatamente en Google Cloud Firestore.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
          >
            Cerrar Explorador
          </button>
        </div>

      </div>
    </div>
  );
};
