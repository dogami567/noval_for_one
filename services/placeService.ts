import { supabase } from './supabaseClient';
import { Place } from '../types';

interface PlaceRow {
  id: string;
  parent_id: string | null;
  kind: string;
  name: string;
  slug: string;
  description: string | null;
  lore_md: string | null;
  cover_image_url: string | null;
  map_x: number | string | null;
  map_y: number | string | null;
  status: string;
}

const mapPlace = (row: PlaceRow): Place => ({
  id: row.id,
  parentId: row.parent_id ?? undefined,
  kind: row.kind as Place['kind'],
  name: row.name,
  slug: row.slug,
  description: row.description ?? '',
  loreMd: row.lore_md ?? '',
  coverImageUrl: row.cover_image_url ?? '',
  mapX: row.map_x === null ? undefined : Number(row.map_x),
  mapY: row.map_y === null ? undefined : Number(row.map_y),
  status: row.status as Place['status'],
});

export const listPlaces = async (): Promise<Place[]> => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('kind', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return ((data as PlaceRow[]) ?? []).map(mapPlace);
};

export const listPlacesForMap = async (): Promise<Place[]> => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .not('map_x', 'is', null)
    .not('map_y', 'is', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data as PlaceRow[]) ?? []).map(mapPlace);
};

export const getPlace = async (id: string): Promise<Place | null> => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPlace(data as PlaceRow) : null;
};

export const getPlaceBySlug = async (slug: string): Promise<Place | null> => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPlace(data as PlaceRow) : null;
};

export const listChildPlaces = async (placeId: string): Promise<Place[]> => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('parent_id', placeId)
    .order('kind', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return ((data as PlaceRow[]) ?? []).map(mapPlace);
};

