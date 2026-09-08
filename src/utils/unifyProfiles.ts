import { Firestore, doc, setDoc, deleteDoc } from '../firebase';
import { FriendProfile } from '../types';

interface UnifyResult {
  unified: boolean;
  message?: string;
  keptProfile?: FriendProfile;
}

/**
 * Cleanly unifies duplicate profiles for the same user if and only if
 * multiple distinct documents exist for the same email or UID.
 * 
 * CRITICAL: This NEVER overwrites or hardcodes user-selected fields like favoriteFood.
 * It strictly preserves the user's authentic profile choices.
 */
export async function unifyDuplicateProfiles(
  db: Firestore,
  userEmail: string | null | undefined,
  currentUid: string,
  allProfiles: FriendProfile[]
): Promise<UnifyResult> {
  if (!userEmail && !currentUid) {
    return { unified: false, message: 'No hay usuario autenticado.' };
  }

  const cleanEmail = (userEmail || '').toLowerCase().trim();

  // Find all profiles matching this email, UID, or exact matching name if provided
  const matchingProfiles = allProfiles.filter(p => {
    const pEmail = (p.email || '').toLowerCase().trim();
    const matchesEmail = cleanEmail && pEmail === cleanEmail;
    const matchesUid = p.id === currentUid;
    return matchesEmail || matchesUid;
  });

  // If there are no duplicates (0 or 1 document), nothing needs to be unified
  if (matchingProfiles.length <= 1) {
    return { 
      unified: false, 
      keptProfile: matchingProfiles[0] 
    };
  }

  // Sort profiles by updatedAt descending so the MOST RECENT user edit ALWAYS wins
  const sorted = [...matchingProfiles].sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  // The most recently updated profile provides the authentic user choices (food, memes, etc.)
  const mostRecent = sorted[0];

  // Preserve the user's authentic most recent choices
  const unifiedData: FriendProfile = {
    ...mostRecent,
    id: currentUid,
    email: userEmail || mostRecent.email || '',
    favoriteFood: mostRecent.favoriteFood || '',
    favoriteMemeStyle: mostRecent.favoriteMemeStyle || '',
    profileCompleted: true,
    updatedAt: mostRecent.updatedAt || new Date().toISOString()
  };

  try {
    // 1. Save / Update the authoritative document at users/{currentUid}
    await setDoc(doc(db, 'users', currentUid), unifiedData, { merge: true });

    // 2. Delete all other duplicate documents in Firestore
    for (const dup of matchingProfiles) {
      if (dup.id !== currentUid) {
        console.log(`Eliminando perfil duplicado en Firestore: ${dup.id}`);
        await deleteDoc(doc(db, 'users', dup.id));
      }
    }

    return {
      unified: true,
      message: `Perfiles duplicados unificados correctamente. Se conservó el perfil de ${unifiedData.name}.`,
      keptProfile: unifiedData
    };
  } catch (err) {
    console.error('Error al unificar perfiles en Firestore:', err);
    return {
      unified: false,
      message: err instanceof Error ? err.message : 'Error desconocido al unificar.'
    };
  }
}
