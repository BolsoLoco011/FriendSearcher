import { DEFAULT_ADMIN_EMAIL } from '../config/admin';
import { AuthorizedEmail, SchoolSettings } from '../types';
import { db, collection, getDocs, doc, getDoc } from '../firebase';

export interface SchoolAuthValidationResult {
  isAllowed: boolean;
  reason?: string;
  matchedEmail?: AuthorizedEmail;
  isAdmin?: boolean;
}

/**
 * Synchronously validates if an email is permitted to log in or register in the school portal.
 */
export function validateSchoolEmail(
  email: string | null | undefined,
  whitelist: AuthorizedEmail[],
  settings: SchoolSettings = { enforceWhitelist: true }
): SchoolAuthValidationResult {
  if (!email) {
    return {
      isAllowed: false,
      reason: 'No se detectó una dirección de correo electrónico válida.'
    };
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. The hardcoded master admin is always authorized
  if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return {
      isAllowed: true,
      isAdmin: true,
      reason: 'Administrador principal escolar por código.'
    };
  }

  // 2. Check whitelist records (comparing both email property and safe document ID)
  const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const match = whitelist.find(item => {
    const itemEmail = (item.email || '').toLowerCase().trim();
    return itemEmail === cleanEmail || item.id === safeId || item.id?.toLowerCase() === cleanEmail;
  });

  if (match) {
    return {
      isAllowed: true,
      matchedEmail: match,
      isAdmin: match.role === 'admin',
      reason: `Correo autorizado en el padrón escolar (${match.role === 'admin' ? 'Administrador' : 'Alumno/Docente'}).`
    };
  }

  // 3. Check allowed domain (e.g. '@escuela.edu') if configured
  if (settings.allowedDomain && settings.allowedDomain.trim()) {
    let domainPattern = settings.allowedDomain.toLowerCase().trim();
    if (!domainPattern.startsWith('@')) {
      domainPattern = '@' + domainPattern;
    }
    if (cleanEmail.endsWith(domainPattern)) {
      return {
        isAllowed: true,
        reason: `Correo institucional correspondiente al dominio escolar ${domainPattern}.`
      };
    }
  }

  // 4. If whitelist enforcement is disabled by the admin
  if (settings.enforceWhitelist === false) {
    return {
      isAllowed: true,
      reason: 'El filtro estricto de padrón está pausado temporalmente por el Administrador.'
    };
  }

  // 5. Not allowed
  return {
    isAllowed: false,
    reason: `El correo ${cleanEmail} no está registrado en el padrón de alumnos ni docentes autorizados de la escuela.`
  };
}

/**
 * Asynchronously verifies if an email is authorized by checking cache first,
 * and falling back to a direct real-time Firestore query if not found in memory.
 * This guarantees zero race-conditions and prevents false-negative lockouts.
 */
export async function checkSchoolEmailAuthorizationAsync(
  email: string | null | undefined,
  cachedWhitelist?: AuthorizedEmail[],
  cachedSettings?: SchoolSettings
): Promise<SchoolAuthValidationResult> {
  if (!email) {
    return {
      isAllowed: false,
      reason: 'No se detectó un correo electrónico válido.'
    };
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. Master admin check
  if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return {
      isAllowed: true,
      isAdmin: true,
      reason: 'Administrador principal escolar por código.'
    };
  }

  // 2. Fast check with cached whitelist if available
  if (cachedWhitelist && cachedWhitelist.length > 0) {
    const quickResult = validateSchoolEmail(email, cachedWhitelist, cachedSettings);
    if (quickResult.isAllowed) {
      return quickResult;
    }
  }

  // 3. Direct Firestore verification to avoid stale cache or race-conditions
  try {
    let settings = cachedSettings;
    if (!settings) {
      const settingsSnap = await getDoc(doc(db, 'settings', 'school_config'));
      if (settingsSnap.exists()) {
        settings = settingsSnap.data() as SchoolSettings;
      } else {
        settings = { enforceWhitelist: true };
      }
    }

    // Check if enforcement is disabled
    if (settings.enforceWhitelist === false) {
      return {
        isAllowed: true,
        reason: 'El filtro estricto de padrón está pausado por el Administrador.'
      };
    }

    // Check domain pattern
    if (settings.allowedDomain && settings.allowedDomain.trim()) {
      let domainPattern = settings.allowedDomain.toLowerCase().trim();
      if (!domainPattern.startsWith('@')) domainPattern = '@' + domainPattern;
      if (cleanEmail.endsWith(domainPattern)) {
        return {
          isAllowed: true,
          reason: `Correo institucional correspondiente al dominio escolar ${domainPattern}.`
        };
      }
    }

    // Direct check by safe ID
    const safeId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const directDoc = await getDoc(doc(db, 'authorized_emails', safeId));
    if (directDoc.exists()) {
      const data = directDoc.data() as AuthorizedEmail;
      return {
        isAllowed: true,
        matchedEmail: data,
        isAdmin: data.role === 'admin',
        reason: `Correo ${cleanEmail} encontrado en el padrón escolar de Firestore.`
      };
    }

    // Also check direct collection iteration in case the document was saved with another ID
    const snap = await getDocs(collection(db, 'authorized_emails'));
    for (const d of snap.docs) {
      const item = d.data() as AuthorizedEmail;
      const itemEmail = (item.email || '').toLowerCase().trim();
      if (itemEmail === cleanEmail || d.id === safeId || d.id.toLowerCase() === cleanEmail) {
        return {
          isAllowed: true,
          matchedEmail: { ...item, id: d.id },
          isAdmin: item.role === 'admin',
          reason: `Correo ${cleanEmail} encontrado en el padrón escolar de Firestore.`
        };
      }
    }

    return {
      isAllowed: false,
      reason: `El correo ${cleanEmail} no figura en el padrón escolar autorizado.`
    };
  } catch (err) {
    console.error('Error fetching authorized_emails directly from Firestore:', err);
    return validateSchoolEmail(email, cachedWhitelist || [], cachedSettings);
  }
}
