export type LocationStatus = 'locked' | 'unlocked';

export type PlaceKind = 'continent' | 'country' | 'city' | 'poi';

export interface Place {
  id: string;
  parentId?: string;
  kind: PlaceKind;
  name: string;
  slug: string;
  description: string;
  loreMd: string;
  coverImageUrl: string;
  mapX?: number; // Percentage 0-100
  mapY?: number; // Percentage 0-100
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
  slug: string;
  aliases?: string[];
  name: string;
  title: string;
  faction: string;
  description: string;
  imageUrl: string;
  lore: string; // Extended biography
  stories?: { title: string; excerpt: string }[]; // legacy (deprecated by 007 stories table)
  currentPlaceId: string; // Drives map/champions filtering (V1)
  homePlaceId?: string; // Optional narrative hook (V2+)
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

export interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMd: string;
  coverImageUrl: string;
}

export type ViewType = 'map' | 'characters' | 'chronicles'; // Kept for navbar highlighting logic, though layout is scroll-based now
