export type LocationStatus = 'locked' | 'unlocked';

export interface Location {
  id: string;
  name: string;
  type: 'ruin' | 'city' | 'nature' | 'mystic';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  description: string;
  lore: string;
  imageUrl: string;
  status: LocationStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  faction: string;
  description: string;
  imageUrl: string;
  lore: string; // Extended biography
  stories: { title: string; excerpt: string }[]; // New field for "stories"
  currentLocationId: string; // Drives map/champions filtering (V1)
  homeLocationId?: string; // Optional narrative hook (V2+)
  discoveryStage: 'hidden' | 'rumor' | 'revealed'; // Character discovery state (V1)
  bio?: string;
  rpPrompt?: string;
  attributes?: Record<string, unknown>;
}

export interface ChronicleEntry {
  id: string;
  title: string;
  date: string;
  summary: string;
  status: 'completed' | 'active' | 'pending';
}

export type ViewType = 'map' | 'characters' | 'chronicles'; // Kept for navbar highlighting logic, though layout is scroll-based now
