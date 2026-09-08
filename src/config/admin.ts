// Centralized configuration for Administrator access
// The primary default admin is defined in code as requested by the user.
export const DEFAULT_ADMIN_EMAIL = 'juan.manuel.ipar@gmail.com';

export const HARDCODED_ADMINS: string[] = [
  DEFAULT_ADMIN_EMAIL
];

export interface AdminCheckOptions {
  email?: string | null;
  isAdminProfile?: boolean;
  role?: string;
  databaseAdmins?: string[];
}

/**
 * Checks whether a given user is an administrator.
 * 1. Default admin in code (juan.manuel.ipar@gmail.com) is ALWAYS admin.
 * 2. Any user with isAdmin: true or role: 'admin' stored in their Firestore profile is an admin.
 * 3. Any user present in the dynamic database admin list is an admin.
 */
export function isUserAdmin(
  emailOrOptions: string | null | undefined | AdminCheckOptions,
  profileIsAdmin?: boolean
): boolean {
  if (!emailOrOptions) return false;

  if (typeof emailOrOptions === 'object') {
    const email = (emailOrOptions.email || '').toLowerCase().trim();
    if (email === DEFAULT_ADMIN_EMAIL) return true;
    if (emailOrOptions.isAdminProfile === true) return true;
    if (emailOrOptions.role === 'admin') return true;
    if (emailOrOptions.databaseAdmins?.map(e => e.toLowerCase().trim()).includes(email)) return true;
    return HARDCODED_ADMINS.includes(email);
  }

  const cleanEmail = emailOrOptions.toLowerCase().trim();
  if (cleanEmail === DEFAULT_ADMIN_EMAIL) return true;
  if (profileIsAdmin === true) return true;
  return HARDCODED_ADMINS.includes(cleanEmail);
}

/**
 * Determines if admin privileges can be revoked.
 * The primary default admin (juan.manuel.ipar@gmail.com) can NEVER have their admin privileges revoked.
 */
export function canRevokeAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() !== DEFAULT_ADMIN_EMAIL;
}

