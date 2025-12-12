import { supabase } from './supabaseClient';
import { Character } from '../types';

interface CharacterRow {
  id: string;
  name: string;
  title: string | null;
  faction: string | null;
  description: string | null;
  lore: string | null;
  image_url: string | null;
  stories: unknown;
  current_location_id: string;
  home_location_id: string | null;
  discovery_stage: string;
  bio: string | null;
  rp_prompt: string | null;
  attributes: unknown;
}

const normalizeStories = (stories: unknown): Character['stories'] => {
  if (Array.isArray(stories)) {
    return stories as Character['stories'];
  }
  return [];
};

const mapCharacter = (row: CharacterRow): Character => ({
  id: row.id,
  name: row.name,
  title: row.title ?? '',
  faction: row.faction ?? '',
  description: row.description ?? '',
  lore: row.lore ?? '',
  imageUrl: row.image_url ?? '',
  stories: normalizeStories(row.stories),
  currentLocationId: row.current_location_id,
  homeLocationId: row.home_location_id ?? undefined,
  discoveryStage: row.discovery_stage as Character['discoveryStage'],
  bio: row.bio ?? undefined,
  rpPrompt: row.rp_prompt ?? undefined,
  attributes: row.attributes ?? undefined,
});

export const listCharacters = async (): Promise<Character[]> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data as CharacterRow[]) ?? []).map(mapCharacter);
};

export const listCharactersByLocation = async (locationId: string): Promise<Character[]> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('current_location_id', locationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data as CharacterRow[]) ?? []).map(mapCharacter);
};

