import { supabase } from './supabaseClient';
import { Story } from '../types';

interface StoryRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  cover_image_url: string | null;
}

const mapStory = (row: StoryRow): Story => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt ?? '',
  contentMd: row.content_md ?? '',
  coverImageUrl: row.cover_image_url ?? '',
});

export const listStories = async (): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as StoryRow[]) ?? []).map(mapStory);
};

export const getStoryBySlug = async (slug: string): Promise<Story | null> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapStory(data as StoryRow) : null;
};

export const listStoriesByCharacter = async (characterId: string): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('story_characters')
    .select('story_id')
    .eq('character_id', characterId);

  if (error) throw error;
  const storyIds = ((data as Array<{ story_id: string }>) ?? [])
    .map((row) => row.story_id)
    .filter(Boolean);

  if (storyIds.length === 0) return [];

  const { data: storiesData, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .in('id', storyIds)
    .order('created_at', { ascending: false });

  if (storiesError) throw storiesError;
  return ((storiesData as StoryRow[]) ?? []).map(mapStory);
};

export const listStoriesByPlace = async (placeId: string): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('story_places')
    .select('story_id')
    .eq('place_id', placeId);

  if (error) throw error;
  const storyIds = ((data as Array<{ story_id: string }>) ?? [])
    .map((row) => row.story_id)
    .filter(Boolean);

  if (storyIds.length === 0) return [];

  const { data: storiesData, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .in('id', storyIds)
    .order('created_at', { ascending: false });

  if (storiesError) throw storiesError;
  return ((storiesData as StoryRow[]) ?? []).map(mapStory);
};

