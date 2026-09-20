/// <reference types="vite/client" />
import { User } from '../firebase';

export const DEV_AUTO_LOGIN_EMAIL = 'j.ipar@elbiofernandez.edu.uy';
export const DEV_AUTO_LOGIN_NAME = 'Juan Manuel Ipar';
export const DEV_USER_UID = 'dev-user-j-ipar';

/**
 * Strictly verifies whether the application is running in local development mode.
 * Triple guard to ensure 100% production safety:
 * 1. import.meta.env.DEV must be true (statically replaced by false during vite build for production).
 * 2. Never triggers on deployed production environments (friendsearcherelef.ai.studio, web.app, etc.).
 * 3. Supports all local dev hostnames: localhost, 127.0.0.1, 0.0.0.0, [::1], .local, and local LAN IPs (192.168.*, 10.*, 172.*).
 */
export function isDevAutoLoginEnabled(): boolean {
  const isDev = Boolean(import.meta.env?.DEV);
  if (!isDev) return false;
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();

  // Strict blacklist: production and testing cloud domains
  if (
    hostname.includes('ai.studio') ||
    hostname.includes('web.app') ||
    hostname.includes('firebaseapp.com') ||
    hostname === 'freandsearcher.ai.studio' ||
    hostname === 'friendsearcherelef.ai.studio' ||
    hostname === 'friendsearchertesting.ai.studio'
  ) {
    return false;
  }

  // Allow all local development hostnames and IPs (localhost, 0.0.0.0, 127.0.0.1, LAN IP)
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.');

  return isLocalHost || !hostname.includes('.');
}

/**
 * Checks if the developer explicitly signed out in the current browser tab session.
 */
export function isDevExplicitlyLoggedOut(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('dev_auth_logged_out') === 'true';
}

/**
 * Records explicit sign out/in in session storage to allow inspecting the AuthWall during dev.
 */
export function setDevExplicitlyLoggedOut(loggedOut: boolean): void {
  if (typeof window === 'undefined') return;
  if (loggedOut) {
    sessionStorage.setItem('dev_auth_logged_out', 'true');
  } else {
    sessionStorage.removeItem('dev_auth_logged_out');
  }
}

/**
 * Pre-completed profile data for j.ipar in local development mode.
 * Marked as admin with completed onboarding so no annoying popups block development.
 */
export const DEV_USER_PROFILE = {
  id: DEV_USER_UID,
  uid: DEV_USER_UID,
  name: DEV_AUTO_LOGIN_NAME,
  email: DEV_AUTO_LOGIN_EMAIL,
  age: 12,
  city: 'Montevideo',
  occupation: 'Estudiante & Creador',
  avatar: '/benja.svg',
  secondaryAvatar: '/benja-cat.svg',
  favoriteFood: 'Milanesas con papas fritas',
  favoriteMemeStyle: 'Humor absurdo / Shitpost',
  traits: ['VIDEOJUEGOS', 'DEPORTES', 'MEMES', 'TECNOLOGIA'],
  bio: 'Perfil institucional automático en modo desarrollo local (Admin)',
  profileCompleted: true,
  role: 'admin',
  isAdmin: true,
  createdAt: new Date().toISOString()
};

/**
 * Creates a synthetic Firebase User instance for j.ipar in local dev.
 */
export function createDevUser(): User {
  return {
    uid: DEV_USER_UID,
    email: DEV_AUTO_LOGIN_EMAIL,
    displayName: DEV_AUTO_LOGIN_NAME,
    photoURL: '/benja.svg',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [
      {
        providerId: 'microsoft.com',
        uid: DEV_USER_UID,
        displayName: DEV_AUTO_LOGIN_NAME,
        email: DEV_AUTO_LOGIN_EMAIL,
        photoURL: '/benja.svg',
        phoneNumber: null
      }
    ],
    refreshToken: 'mock-dev-refresh-token',
    tenantId: null,
    phoneNumber: null,
    providerId: 'microsoft.com',
    delete: async () => {},
    getIdToken: async () => 'dev-mock-id-token',
    getIdTokenResult: async () => ({
      token: 'dev-mock-id-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      signInProvider: 'microsoft.com',
      signInSecondFactor: null,
      claims: {
        admin: true,
        email: DEV_AUTO_LOGIN_EMAIL
      }
    }),
    reload: async () => {},
    toJSON: () => ({
      uid: DEV_USER_UID,
      email: DEV_AUTO_LOGIN_EMAIL,
      displayName: DEV_AUTO_LOGIN_NAME,
      photoURL: '/benja.svg'
    })
  } as unknown as User;
}
