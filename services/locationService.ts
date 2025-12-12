import { supabase } from './supabaseClient';
import { Location } from '../types';

interface LocationRow {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  description: string | null;
  lore: string | null;
  image_url: string | null;
  status: string;
}

const mapLocation = (row: LocationRow): Location => ({
  id: row.id,
  name: row.name,
  type: row.type as Location['type'],
  x: Number(row.x),
  y: Number(row.y),
  description: row.description ?? '',
  lore: row.lore ?? '',
  imageUrl: row.image_url ?? '',
  status: row.status as Location['status'],
});

export const listLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data as LocationRow[]) ?? []).map(mapLocation);
};

export const getLocation = async (id: string): Promise<Location | null> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapLocation(data as LocationRow) : null;
};

