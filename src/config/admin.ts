// Centralized configuration for Administrator access
// The primary default admin is defined in code as requested by the user.
export const DEFAULT_ADMIN_EMAIL = 'juan.manuel.ipar@gmail.com';

// Testing environment configuration (friendsearchertesting.ai.studio)
export const TESTING_DOMAIN = 'friendsearchertesting.ai.studio';
export const TESTING_ADMIN_EMAIL = 'ipar.fernando@gmail.com';

/**
 * Returns true if the app is currently running in the testing environment:
 * - Hosted on friendsearchertesting.ai.studio
 * - Or running locally in dev mode (localhost / 127.0.0.1)
 * Guaranteed to return false on production (friendsearcherelef.ai.studio).
 */
export function isTestingEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  // Production domain is strictly protected from testing rules
  if (hostname === 'friendsearcherelef.ai.studio') return false;
  const isDev = Boolean((import.meta as { env?: { DEV?: boolean } })?.env?.DEV);
  return (
    hostname === TESTING_DOMAIN ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    isDev
  );
}

export const HARDCODED_ADMINS: string[] = [
  DEFAULT_ADMIN_EMAIL
];

/**
 * Returns the list of hardcoded administrators active for the current environment.
 */
export function getHardcodedAdmins(): string[] {
  const admins = [DEFAULT_ADMIN_EMAIL.toLowerCase()];
  if (isTestingEnvironment()) {
    admins.push(TESTING_ADMIN_EMAIL.toLowerCase());
  }
  return admins;
}

export interface AdminCheckOptions {
  email?: string | null;
  isAdminProfile?: boolean;
  role?: string;
  databaseAdmins?: string[];
}

/**
 * Checks whether a given user is an administrator.
 * 1. Default admin in code (juan.manuel.ipar@gmail.com) is ALWAYS admin.
 * 2. Testing admin (ipar.fernando@gmail.com) is admin when running in testing environment.
 * 3. Any user with isAdmin: true or role: 'admin' stored in their Firestore profile is an admin.
 * 4. Any user present in the dynamic database admin list is an admin.
 */
export function isUserAdmin(
  emailOrOptions: string | null | undefined | AdminCheckOptions,
  profileIsAdmin?: boolean
): boolean {
  if (!emailOrOptions) return false;

  const hardcoded = getHardcodedAdmins();

  if (typeof emailOrOptions === 'object') {
    const email = (emailOrOptions.email || '').toLowerCase().trim();
    if (hardcoded.includes(email)) return true;
    if (emailOrOptions.isAdminProfile === true) return true;
    if (emailOrOptions.role === 'admin') return true;
    if (emailOrOptions.databaseAdmins?.map(e => e.toLowerCase().trim()).includes(email)) return true;
    return false;
  }

  const cleanEmail = emailOrOptions.toLowerCase().trim();
  if (hardcoded.includes(cleanEmail)) return true;
  if (profileIsAdmin === true) return true;
  return false;
}

/**
 * Determines if admin privileges can be revoked.
 * Primary default admins and testing admins cannot have their roles revoked.
 */
export function canRevokeAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) return false;
  if (isTestingEnvironment() && cleanEmail === TESTING_ADMIN_EMAIL.toLowerCase()) return false;
  return true;
}

