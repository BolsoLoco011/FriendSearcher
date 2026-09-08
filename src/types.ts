export type CategoryKey = 'caracteristicas' | 'memes' | 'cocina' | 'eventos' | 'grupos' | 'gimnasio';

export interface CategoryCardInfo {
  key: CategoryKey;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  countLabel: string;
  color: string;
  iconName: string;
  description: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  city: string;
  occupation: string;
  bio: string;
  matchScore: number;
  highlightCategory: CategoryKey;
  traits: string[];
  favoriteFood: string;
  favoriteMemeStyle: string;
  joinedEvent: string;
  joinedGroup: string;
  isConnected?: boolean;
  email?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
  profileCompleted?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface MemeItem {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  author: string;
  sharedByFriend: string;
  tag: string;
  userVoted?: boolean;
}

export interface CookingItem {
  id: string;
  title: string;
  cuisine: string;
  level: string;
  hostName: string;
  imageUrl: string;
  membersInterested: number;
  nextGathering: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  attendees: number;
  categoryTag: string;
  isJoined?: boolean;
}

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  members: number;
  activityLevel: 'Muy activo' | 'Activo' | 'Nuevo';
  tags: string[];
  isJoined?: boolean;
}

export interface AuthorizedEmail {
  id: string;
  email: string;
  role?: 'admin' | 'user';
  notes?: string;
  addedBy?: string;
  createdAt?: string;
}

export interface SchoolSettings {
  id?: string;
  enforceWhitelist: boolean;
  allowedDomain?: string; // ej: 'escuela.edu' o 'colegio.edu.uy'
  schoolName?: string;
  updatedAt?: string;
}

export interface GymItem {
  id: string;
  title: string;
  activity: string; // ej: 'Fuerza & Pesas', 'Calistenia', 'Crossfit', 'Cardio & Running'
  location: string;
  hostName: string;
  imageUrl: string;
  membersCount: number;
  schedule: string;
  isJoined?: boolean;
  notes?: string;
}

