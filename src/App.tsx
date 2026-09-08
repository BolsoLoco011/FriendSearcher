/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Square4KCards } from './components/Square4KCards';
import { FriendsFeed } from './components/FriendsFeed';
import { CategoryDetailModal } from './components/CategoryDetailModal';
import { FriendDetailModal } from './components/FriendDetailModal';
import { CreateModal } from './components/CreateModal';
import { AuthModal } from './components/AuthModal';
import { FirestoreManagerModal } from './components/FirestoreManagerModal';
import { AuthWall } from './components/AuthWall';
import { OnboardingProfileModal } from './components/OnboardingProfileModal';
import { unifyDuplicateProfiles } from './utils/unifyProfiles';
import { 
  CATEGORIES_DATA, 
  INITIAL_FRIENDS, 
  INITIAL_MEMES, 
  INITIAL_COOKING, 
  INITIAL_EVENTS, 
  INITIAL_GROUPS,
  INITIAL_GYM
} from './data/mockData';
import { CategoryKey, CategoryCardInfo, FriendProfile, MemeItem, CookingItem, EventItem, GroupItem, GymItem, AuthorizedEmail, SchoolSettings } from './types';
import { Sparkles, HeartHandshake, Compass, Flame, CloudCheck, ShieldCheck, AlertOctagon, GraduationCap } from 'lucide-react';
import { isUserAdmin, DEFAULT_ADMIN_EMAIL } from './config/admin';
import { validateSchoolEmail, checkSchoolEmailAuthorizationAsync } from './utils/schoolAuth';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  User, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  getDocs
} from './firebase';

export default function App() {
  // Pure Firestore-driven state (starts empty and loads directly from cloud database)
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [cooking, setCooking] = useState<CookingItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [gym, setGym] = useState<GymItem[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [isAuthEmailsLoaded, setIsAuthEmailsLoaded] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    enforceWhitelist: true,
    allowedDomain: '',
    schoolName: 'Portal Escolar'
  });
  const [unauthorizedBlockedMsg, setUnauthorizedBlockedMsg] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [editingFriendIdForDb, setEditingFriendIdForDb] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [activeTraitFilter, setActiveTraitFilter] = useState<string | null>(null);

  const [activeCategoryModal, setActiveCategoryModal] = useState<CategoryCardInfo | null>(null);
  const [activeFriendModal, setActiveFriendModal] = useState<FriendProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  // 1.0 Real-time sync for School Authorized Emails (Whitelist) & School Settings
  useEffect(() => {
    // Listen to authorized emails collection
    const unsubAuthEmails = onSnapshot(collection(db, 'authorized_emails'), (snapshot) => {
      if (snapshot.empty) {
        // Automatically seed the primary hardcoded master admin
        const initialMasterDoc = {
          id: 'admin_master',
          email: DEFAULT_ADMIN_EMAIL,
          role: 'admin',
          notes: 'Administrador Principal (Definido en código)',
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'authorized_emails', 'admin_master'), initialMasterDoc, { merge: true }).catch(() => {});
        setAuthorizedEmails([initialMasterDoc as AuthorizedEmail]);
        setIsAuthEmailsLoaded(true);
      } else {
        const loaded = snapshot.docs.map(d => {
          const data = d.data();
          let email = (data.email || '').toString().trim();
          if (!email && d.id.includes('@')) {
            email = d.id.trim();
          } else if (!email && d.id.includes('_gmail_com')) {
            email = d.id.replace(/_gmail_com$/, '@gmail.com').replace(/_/g, '.');
          }
          return {
            id: d.id,
            email: email || data.email || d.id,
            role: data.role || 'user',
            notes: data.notes || '',
            createdAt: data.createdAt
          } as AuthorizedEmail;
        });
        setAuthorizedEmails(loaded);
        setIsAuthEmailsLoaded(true);
      }
    }, (err) => {
      console.warn('Authorized emails sync error:', err);
      setIsAuthEmailsLoaded(true);
    });

    // Listen to school configuration policies
    const unsubSettings = onSnapshot(doc(db, 'settings', 'school_config'), (snap) => {
      if (snap.exists()) {
        setSchoolSettings(snap.data() as SchoolSettings);
      } else {
        const initialSettings: SchoolSettings = {
          enforceWhitelist: true,
          allowedDomain: '',
          schoolName: 'Portal Escolar'
        };
        setDoc(doc(db, 'settings', 'school_config'), initialSettings, { merge: true }).catch(() => {});
        setSchoolSettings(initialSettings);
      }
    }, (err) => {
      console.warn('School settings sync notice:', err);
    });

    return () => {
      unsubAuthEmails();
      unsubSettings();
    };
  }, []);

  // 1.1 Verify school whitelist access whenever user or authorized list changes
  useEffect(() => {
    if (!currentUser || !currentUser.email || !isAuthEmailsLoaded) return;

    // Fast in-memory check
    const quickValidation = validateSchoolEmail(currentUser.email, authorizedEmails, schoolSettings);
    if (quickValidation.isAllowed) {
      return;
    }

    // If quick validation didn't match, verify directly with Firestore before logging out to avoid race conditions
    let isMounted = true;
    checkSchoolEmailAuthorizationAsync(currentUser.email, authorizedEmails, schoolSettings).then((res) => {
      if (!isMounted) return;
      if (!res.isAllowed) {
        auth.signOut().then(() => {
          setUnauthorizedBlockedMsg(
            res.reason || `El correo ${currentUser.email} no cuenta con autorización en el padrón escolar.`
          );
        }).catch(console.error);
      }
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [currentUser, authorizedEmails, schoolSettings, isAuthEmailsLoaded]);

  // 1.2 Check if current user profile is completed in Firestore
  useEffect(() => {
    if (!currentUser) {
      setNeedsOnboarding(false);
      setUserProfileData(null);
      return;
    }

    const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (!snap.exists()) {
        // No profile document exists yet for this Google or Email user
        setNeedsOnboarding(true);
        setUserProfileData(null);
      } else {
        const data = snap.data();
        setUserProfileData(data);
        // If missing required onboarding fields (age, city, favorite food, meme style)
        if (!data.profileCompleted || !data.city || !data.age || !data.favoriteFood || !data.favoriteMemeStyle) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      }
    }, (err) => {
      console.warn('Error checking user profile onboarding status:', err);
    });

    return () => unsubUser();
  }, [currentUser]);

  // 2. Real-time Firestore sync with cloud database collections (Only when logged in)
  useEffect(() => {
    if (!currentUser) {
      setIsSyncing(false);
      setIsLoadingUsers(false);
      return;
    }

    setIsSyncing(true);
    setIsLoadingUsers(true);

    // Sync Users / Friends directly from Firestore
    const unsubFriends = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        // If collection has 0 documents, populate Firestore with initial set
        INITIAL_FRIENDS.forEach(f => {
          setDoc(doc(db, 'users', f.id), f, { merge: true }).catch(() => {});
        });
      } else {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FriendProfile));
        setFriends(list);

        // Ensure f-2 is removed from Firestore if present
        if (snapshot.docs.some(d => d.id === 'f-2')) {
          deleteDoc(doc(db, 'users', 'f-2')).catch(() => {});
        }

        // Ensure predefined initial profiles from code exist in Firestore if not already present
        INITIAL_FRIENDS.forEach(f => {
          const exists = list.some(p => p.id === f.id);
          if (!exists) {
            setDoc(doc(db, 'users', f.id), f, { merge: true }).catch(() => {});
          }
        });

        // Auto-unify duplicate profiles only if multiple matching documents exist
        if (currentUser && currentUser.uid) {
          const cleanEmail = (currentUser.email || '').toLowerCase().trim();
          const duplicates = list.filter(p => {
            const pEmail = (p.email || '').toLowerCase().trim();
            return (cleanEmail && pEmail === cleanEmail) || p.id === currentUser.uid;
          });
          if (duplicates.length > 1) {
            unifyDuplicateProfiles(db, currentUser.email, currentUser.uid, list).then(res => {
              if (res.unified) {
                console.log('Perfiles unificados con éxito:', res.message);
              }
            }).catch(console.error);
          }
        }
      }
      setIsLoadingUsers(false);
      setIsSyncing(false);
    }, (err) => {
      console.warn('Users Firestore notice:', err);
      setIsLoadingUsers(false);
      setIsSyncing(false);
    });

    // Sync Memes directly from Firestore
    const unsubMemes = onSnapshot(collection(db, 'memes'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_MEMES.forEach(m => {
          setDoc(doc(db, 'memes', m.id), m, { merge: true }).catch(() => {});
        });
      } else {
        const loaded = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MemeItem));
        const m1 = loaded.find(m => m.id === 'm-1');
        if (m1 && (m1.title !== 'GENIO !' || m1.sharedByFriend !== 'Juanma Ipar' || m1.imageUrl !== '/genio.svg')) {
          setDoc(doc(db, 'memes', 'm-1'), {
            title: 'GENIO !',
            imageUrl: '/genio.svg',
            author: 'Juanma Ipar',
            sharedByFriend: 'Juanma Ipar',
            tag: 'Clásico Amistad'
          }, { merge: true }).catch(() => {});
        }
        setMemes(loaded.map(m => m.id === 'm-1' ? {
          ...m,
          title: 'GENIO !',
          imageUrl: '/genio.svg',
          author: 'Juanma Ipar',
          sharedByFriend: 'Juanma Ipar'
        } : m));
      }
    }, (err) => console.warn('Memes Firestore notice:', err));

    // Sync Cooking directly from Firestore
    const unsubCooking = onSnapshot(collection(db, 'cooking'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_COOKING.forEach(c => {
          setDoc(doc(db, 'cooking', c.id), c, { merge: true }).catch(() => {});
        });
      } else {
        setCooking(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CookingItem)));
      }
    }, (err) => console.warn('Cooking Firestore notice:', err));

    // Sync Events directly from Firestore
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_EVENTS.forEach(e => {
          setDoc(doc(db, 'events', e.id), e, { merge: true }).catch(() => {});
        });
      } else {
        setEvents(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as EventItem)));
      }
    }, (err) => console.warn('Events Firestore notice:', err));

    // Sync Groups directly from Firestore
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_GROUPS.forEach(g => {
          setDoc(doc(db, 'groups', g.id), g, { merge: true }).catch(() => {});
        });
      } else {
        setGroups(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as GroupItem)));
      }
    }, (err) => console.warn('Groups Firestore notice:', err));

    // Sync Gym directly from Firestore
    const unsubGym = onSnapshot(collection(db, 'gym'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_GYM.forEach(g => {
          setDoc(doc(db, 'gym', g.id), g, { merge: true }).catch(() => {});
        });
      } else {
        setGym(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as GymItem)));
      }
    }, (err) => console.warn('Gym Firestore notice:', err));

    return () => {
      unsubFriends();
      unsubMemes();
      unsubCooking();
      unsubEvents();
      unsubGroups();
      unsubGym();
    };
  }, [currentUser]);

  // Force manual refresh from Firestore
  const handleForceRefreshDb = async () => {
    setIsSyncing(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as FriendProfile));
      setFriends(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete friend directly from Firestore
  const handleDeleteFriend = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.error('Error deleting friend from Firestore:', err);
    }
  };

  // Toggle friend connection with Firestore persistence
  const handleToggleConnect = async (id: string) => {
    const friend = friends.find(f => f.id === id);
    const newStatus = friend ? !friend.isConnected : true;

    setFriends(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, isConnected: newStatus };
      }
      return f;
    }));

    if (activeFriendModal && activeFriendModal.id === id) {
      setActiveFriendModal(prev => prev ? { ...prev, isConnected: newStatus } : null);
    }

    try {
      await setDoc(doc(db, 'users', id), { isConnected: newStatus }, { merge: true });
    } catch (err) {
      console.warn('Error syncing connect to Firestore:', err);
    }
  };

  // Toggle meme like/vote with Firestore persistence
  const handleToggleMemeVote = async (id: string) => {
    const meme = memes.find(m => m.id === id);
    const newVoted = meme ? !meme.userVoted : true;
    const newLikes = meme ? (newVoted ? meme.likes + 1 : Math.max(0, meme.likes - 1)) : 1;

    setMemes(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, userVoted: newVoted, likes: newLikes };
      }
      return m;
    }));

    try {
      await setDoc(doc(db, 'memes', id), { userVoted: newVoted, likes: newLikes }, { merge: true });
    } catch (err) {
      console.warn('Error syncing meme vote to Firestore:', err);
    }
  };

  // Toggle event RSVP with Firestore persistence
  const handleToggleEventJoin = async (id: string) => {
    const ev = events.find(e => e.id === id);
    const newJoined = ev ? !ev.isJoined : true;
    const newCount = ev ? (newJoined ? ev.attendees + 1 : Math.max(0, ev.attendees - 1)) : 1;

    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, isJoined: newJoined, attendees: newCount };
      }
      return e;
    }));

    try {
      await setDoc(doc(db, 'events', id), { isJoined: newJoined, attendees: newCount }, { merge: true });
    } catch (err) {
      console.warn('Error syncing event join to Firestore:', err);
    }
  };

  // Toggle group join with Firestore persistence
  const handleToggleGroupJoin = async (id: string) => {
    const grp = groups.find(g => g.id === id);
    const newJoined = grp ? !grp.isJoined : true;
    const newMembers = grp ? (newJoined ? grp.membersCount + 1 : Math.max(0, grp.membersCount - 1)) : 1;

    setGroups(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, isJoined: newJoined, membersCount: newMembers };
      }
      return g;
    }));

    try {
      await setDoc(doc(db, 'groups', id), { isJoined: newJoined, membersCount: newMembers }, { merge: true });
    } catch (err) {
      console.warn('Error syncing group join to Firestore:', err);
    }
  };

  // Toggle gym join with Firestore persistence
  const handleToggleGymJoin = async (id: string) => {
    const item = gym.find(g => g.id === id);
    const newJoined = item ? !item.isJoined : true;
    const newMembers = item ? (newJoined ? item.membersCount + 1 : Math.max(0, item.membersCount - 1)) : 1;

    setGym(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, isJoined: newJoined, membersCount: newMembers };
      }
      return g;
    }));

    try {
      await setDoc(doc(db, 'gym', id), { isJoined: newJoined, membersCount: newMembers }, { merge: true });
    } catch (err) {
      console.warn('Error syncing gym join to Firestore:', err);
    }
  };

  // Open Category detail
  const handleOpenCategoryDetail = (key: CategoryKey) => {
    const cat = CATEGORIES_DATA.find(c => c.key === key) || null;
    setActiveCategoryModal(cat);
  };

  // Adding new entities to Firestore
  const handleAddFriend = async (newFriend: FriendProfile) => {
    setFriends(prev => [newFriend, ...prev]);
    try {
      await setDoc(doc(db, 'users', newFriend.id), newFriend);
    } catch (err) {
      console.warn('Error saving friend to Firestore:', err);
    }
  };

  const handleAddEvent = async (newEvent: EventItem) => {
    setEvents(prev => [newEvent, ...prev]);
    try {
      await setDoc(doc(db, 'events', newEvent.id), newEvent);
    } catch (err) {
      console.warn('Error saving event to Firestore:', err);
    }
  };

  const handleAddMeme = async (newMeme: MemeItem) => {
    setMemes(prev => [newMeme, ...prev]);
    try {
      await setDoc(doc(db, 'memes', newMeme.id), newMeme);
    } catch (err) {
      console.warn('Error saving meme to Firestore:', err);
    }
  };

  const handleAddCooking = async (newCooking: CookingItem) => {
    setCooking(prev => [newCooking, ...prev]);
    try {
      await setDoc(doc(db, 'cooking', newCooking.id), newCooking);
    } catch (err) {
      console.warn('Error saving cooking to Firestore:', err);
    }
  };

  // School Whitelist & Roles Handlers
  const handleAddAuthorizedEmail = async (email: string, role: 'admin' | 'user', notes: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    await setDoc(doc(db, 'authorized_emails', safeId), {
      id: safeId,
      email: cleanEmail,
      role,
      notes,
      addedBy: currentUser?.email || 'admin',
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleDeleteAuthorizedEmail = async (id: string) => {
    await deleteDoc(doc(db, 'authorized_emails', id));
  };

  const handleUpdateUserAdminRole = async (userId: string, newIsAdmin: boolean, userEmail?: string) => {
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: newIsAdmin,
      role: newIsAdmin ? 'admin' : 'user'
    });

    if (userEmail) {
      const cleanEmail = userEmail.toLowerCase().trim();
      const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'authorized_emails', safeId), {
        id: safeId,
        email: cleanEmail,
        role: newIsAdmin ? 'admin' : 'user',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const handleUpdateUserProfile = async (userId: string, data: Partial<FriendProfile>) => {
    const updatedTime = new Date().toISOString();
    const cleanPayload = {
      ...data,
      updatedAt: updatedTime
    };

    // 1. Update target document in Firestore with merge: true
    await setDoc(doc(db, 'users', userId), cleanPayload, { merge: true });

    // 2. Identify target user to check for duplicate historical documents in Firestore
    const targetUser = friends.find(f => f.id === userId);
    const targetName = (targetUser?.name || data.name || '').toLowerCase().trim();
    const targetEmail = (targetUser?.email || data.email || '').toLowerCase().trim();

    // 3. Search and purge any other duplicate documents in Firestore with same email or exact same name
    if (targetEmail || targetName) {
      const duplicates = friends.filter(f => {
        if (f.id === userId) return false;
        const fEmail = (f.email || '').toLowerCase().trim();
        const fName = (f.name || '').toLowerCase().trim();
        const matchesEmail = targetEmail && fEmail === targetEmail;
        const matchesName = targetName && fName === targetName;
        return matchesEmail || matchesName;
      });

      for (const dup of duplicates) {
        console.log(`Eliminando documento duplicado obsoleto de ${targetName || targetEmail}: ${dup.id}`);
        await deleteDoc(doc(db, 'users', dup.id)).catch(console.error);
      }

      // Update local state immediately
      setFriends(prev => prev.map(f => {
        if (f.id === userId) {
          return { ...f, ...cleanPayload };
        }
        return f;
      }).filter(f => !duplicates.some(d => d.id === f.id)));
    } else {
      setFriends(prev => prev.map(f => f.id === userId ? { ...f, ...cleanPayload } : f));
    }

    if (userProfileData && (userId === userProfileData.id || userId === currentUser?.uid || (targetEmail && userProfileData.email?.toLowerCase().trim() === targetEmail))) {
      setUserProfileData(prev => prev ? ({ ...prev, ...cleanPayload }) : null);
    }
  };

  const handleSaveSchoolSettings = async (newSettings: SchoolSettings) => {
    await setDoc(doc(db, 'settings', 'school_config'), {
      ...newSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleOpenEditFriendInDb = (friend: FriendProfile) => {
    setEditingFriendIdForDb(friend.id);
    setIsDbModalOpen(true);
  };

  const connectionsCount = friends.filter(f => f.isConnected).length;

  const activeUserProfile = userProfileData || (currentUser ? friends.find(f => f.email === currentUser.email || f.id === currentUser.uid) : null);

  // Real-time admin verification based on default code admin + Firestore profiles + database admins
  const isAdmin = isUserAdmin({
    email: currentUser?.email,
    isAdminProfile: userProfileData?.isAdmin,
    role: userProfileData?.role,
    databaseAdmins: authorizedEmails.filter(a => a.role === 'admin').map(a => a.email)
  });

  // 1. Initial auth loading state
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-200 mb-4 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700">Iniciando FriendSearcher...</p>
        <p className="text-xs text-slate-400 mt-1">Verificando sesión segura en Firestore</p>
      </div>
    );
  }

  // 2. Option 1: Must register / log in first before seeing anything
  if (!currentUser) {
    return (
      <>
        {unauthorizedBlockedMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl shadow-xl flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold">Acceso Escolar Denegado</p>
                <p className="mt-0.5 leading-relaxed">{unauthorizedBlockedMsg}</p>
                <button
                  onClick={() => setUnauthorizedBlockedMsg(null)}
                  className="mt-2 text-rose-700 font-bold hover:underline"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
        <AuthWall 
          onSuccess={() => setUnauthorizedBlockedMsg(null)}
          whitelist={authorizedEmails}
          schoolSettings={schoolSettings}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* App Header with the Celeste Capsule Title */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        connectionsCount={connectionsCount}
        totalFriends={friends.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDbManager={() => setIsDbModalOpen(true)}
        isSyncing={isSyncing}
        isAdmin={isAdmin}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* Hero Section - Clean Minimalism Presentation */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 text-center sm:text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          
          <div className="max-w-2xl">
            {/* Título en Cápsula Celeste Destacada */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs sm:text-sm font-semibold mb-3 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Cápsula Celeste de Conexión</span>
              <span className="text-sky-300">•</span>
              <span className="text-sky-800">App Web Oficial</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Reinventa cómo hacer amigos con <span className="text-sky-600">FriendSearcher</span>
            </h1>

            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Explora los <strong>cuadrados</strong> de características, memes, cocina, eventos, grupos temáticos y gimnasio. Conecta con personas que vibran en tu misma sintonía con gustos y planes reales.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5 justify-center sm:justify-start text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-sky-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Compatibilidad</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-emerald-700 font-medium">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                <span>Base de Datos Firestore Activa</span>
              </div>
              <button 
                onClick={() => setIsDbModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 font-semibold cursor-pointer transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Explorar BD Firestore ({friends.length} perfiles)</span>
              </button>
            </div>
          </div>

          {/* Quick Action Badge in Hero */}
          <div className="bg-slate-50 border border-slate-200/90 p-5 rounded-2xl flex flex-col items-center text-center w-full sm:w-64 flex-shrink-0 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold mb-2 shadow-md shadow-sky-200">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Explorador Rápido</span>
            <span className="text-base font-bold text-slate-800 mt-0.5">6 Pilares 4K HD</span>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Toca un cuadrado para filtrar el feed o ver contenido exclusivo.
            </p>
          </div>

        </div>

        {/* 1. LOS CUADRADOS 4K HD DE: CARACTERÍSTICAS, MEMES, COCINA, EVENTOS, GRUPOS Y GIMNASIO */}
        <Square4KCards
          categories={CATEGORIES_DATA}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onOpenCategoryDetail={handleOpenCategoryDetail}
        />

        {/* 2. FEED Y BUSCADOR DE AMIGOS CON CARGA DESDE FIRESTORE */}
        <FriendsFeed
          friends={friends}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onOpenFriendDetail={(friend) => setActiveFriendModal(friend)}
          onToggleConnect={handleToggleConnect}
          activeTraitFilter={activeTraitFilter}
          onClearTraitFilter={() => setActiveTraitFilter(null)}
          isLoading={isLoadingUsers}
          onDeleteFriend={handleDeleteFriend}
          onOpenDbManager={() => { setEditingFriendIdForDb(null); setIsDbModalOpen(true); }}
          currentUserProfile={activeUserProfile}
          isAdmin={isAdmin}
          onEditFriendInDb={handleOpenEditFriendInDb}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-bold shadow-xs">
              FriendSearcher
            </div>
            <span className="text-slate-500">• Datos en vivo de Google Cloud Firestore</span>
          </div>

          <p className="text-slate-400">
            Características • Memes • Cocina • Eventos • Grupos • Gimnasio
          </p>

          <button
            onClick={() => {
              setIsSyncing(true);
              INITIAL_FRIENDS.forEach(f => {
                setDoc(doc(db, 'users', f.id), f, { merge: true }).catch(() => {});
              });
              setSelectedCategory('all');
              setActiveTraitFilter(null);
            }}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer"
          >
            Restablecer perfil de Bruno Silva a Firestore
          </button>
        </div>
      </footer>

      {/* Category Detail Modal */}
      <CategoryDetailModal
        category={activeCategoryModal}
        onClose={() => setActiveCategoryModal(null)}
        memes={memes}
        cooking={cooking}
        events={events}
        groups={groups}
        gym={gym}
        friends={friends}
        onOpenFriendDetail={(friend) => setActiveFriendModal(friend)}
        onToggleConnect={handleToggleConnect}
        onToggleMemeVote={handleToggleMemeVote}
        onToggleEventJoin={handleToggleEventJoin}
        onToggleGroupJoin={handleToggleGroupJoin}
        onToggleGymJoin={handleToggleGymJoin}
        onSelectTraitFilter={(trait) => {
          setActiveTraitFilter(trait);
          setActiveCategoryModal(null);
        }}
        currentUserProfile={activeUserProfile}
      />

      {/* Friend Detail & Chat Modal */}
      <FriendDetailModal
        friend={activeFriendModal}
        onClose={() => setActiveFriendModal(null)}
        onToggleConnect={handleToggleConnect}
        currentUserProfile={activeUserProfile}
        isAdmin={isAdmin}
        onEditUserInDb={handleOpenEditFriendInDb}
      />

      {/* Create Event/Meme/Cooking/Friend Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddEvent={handleAddEvent}
        onAddMeme={handleAddMeme}
        onAddCooking={handleAddCooking}
        onAddFriend={handleAddFriend}
      />

      {/* Auth Modal for Google and Anonymous Sign-In */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onOpenEditProfile={() => setIsEditingProfile(true)}
        onOpenDbManager={() => setIsDbModalOpen(true)}
        whitelist={authorizedEmails}
        schoolSettings={schoolSettings}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Onboarding Profile Modal (Required on first Google or Email login, or when editing profile) */}
      {currentUser && (
        <OnboardingProfileModal
          currentUser={currentUser}
          isOpen={needsOnboarding || isEditingProfile}
          initialData={userProfileData || {
            name: currentUser.displayName || '',
            avatar: currentUser.photoURL || undefined
          }}
          onComplete={() => {
            setNeedsOnboarding(false);
            setIsEditingProfile(false);
          }}
        />
      )}

      {/* Firestore Live Database Inspector Modal */}
      <FirestoreManagerModal
        isOpen={isDbModalOpen}
        onClose={() => {
          setIsDbModalOpen(false);
          setEditingFriendIdForDb(null);
        }}
        currentUser={currentUser}
        friends={friends}
        memes={memes}
        cooking={cooking}
        events={events}
        groups={groups}
        gym={gym}
        authorizedEmails={authorizedEmails}
        schoolSettings={schoolSettings}
        onRefresh={handleForceRefreshDb}
        isSyncing={isSyncing}
        onAddAuthorizedEmail={handleAddAuthorizedEmail}
        onDeleteAuthorizedEmail={handleDeleteAuthorizedEmail}
        onUpdateUserAdminRole={handleUpdateUserAdminRole}
        onUpdateUserProfile={handleUpdateUserProfile}
        onSaveSchoolSettings={handleSaveSchoolSettings}
        initialEditingUserId={editingFriendIdForDb}
      />

    </div>
  );
}
