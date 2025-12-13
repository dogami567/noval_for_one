import { Place } from '../types';
import { getPlace, listPlacesForMap } from './placeService';

// Compatibility layer for legacy callers (map still uses Place now).
export const listLocations = async (): Promise<Place[]> => listPlacesForMap();
export const getLocation = async (id: string): Promise<Place | null> => getPlace(id);
