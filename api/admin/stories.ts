import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminTokenSecret = process.env.ADMIN_EDIT_TOKEN;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

const isAdminRequest = (req: VercelRequest): boolean => {
  const token = req.headers['x-admin-token'];
  if (!adminTokenSecret) return false;
  if (typeof token === 'string') return token === adminTokenSecret;
  if (Array.isArray(token)) return token[0] === adminTokenSecret;
  return false;
};

const getBody = (req: VercelRequest) => {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

const normalizeIdArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? '').trim())
    .filter((v) => v.length > 0)
    .filter((v, i, arr) => arr.indexOf(v) === i);
};

const saveStoryRelations = async (
  storyId: string,
  characterIds: string[],
  placeIds: string[]
) => {
  if (!supabaseAdmin) return;

  const { error: delCharError } = await supabaseAdmin
    .from('story_characters')
    .delete()
    .eq('story_id', storyId);
  if (delCharError) throw delCharError;

  const { error: delPlaceError } = await supabaseAdmin
    .from('story_places')
    .delete()
    .eq('story_id', storyId);
  if (delPlaceError) throw delPlaceError;

  if (characterIds.length > 0) {
    const { error } = await supabaseAdmin.from('story_characters').insert(
      characterIds.map((id) => ({
        story_id: storyId,
        character_id: id,
      }))
    );
    if (error) throw error;
  }

  if (placeIds.length > 0) {
    const { error } = await supabaseAdmin.from('story_places').insert(
      placeIds.map((id) => ({
        story_id: storyId,
        place_id: id,
      }))
    );
    if (error) throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!supabaseAdmin) {
    res.status(500).json({ message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    return;
  }

  try {
    switch (req.method) {
      case 'GET': {
        const id = req.query.id;
        if (id && !Array.isArray(id)) {
          const { data: story, error } = await supabaseAdmin
            .from('stories')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          if (error) throw error;

          const { data: storyCharacters, error: charError } = await supabaseAdmin
            .from('story_characters')
            .select('character_id')
            .eq('story_id', id);
          if (charError) throw charError;

          const { data: storyPlaces, error: placeError } = await supabaseAdmin
            .from('story_places')
            .select('place_id')
            .eq('story_id', id);
          if (placeError) throw placeError;

          res.status(200).json({
            data: {
              story: story ?? null,
              character_ids: ((storyCharacters as Array<{ character_id: string }>) ?? []).map(
                (r) => r.character_id
              ),
              place_ids: ((storyPlaces as Array<{ place_id: string }>) ?? []).map((r) => r.place_id),
            },
          });
          return;
        }

        const { data, error } = await supabaseAdmin
          .from('stories')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        res.status(200).json({ data });
        return;
      }
      case 'POST': {
        const payload = getBody(req);
        const characterIds = normalizeIdArray((payload as any).character_ids);
        const placeIds = normalizeIdArray((payload as any).place_ids);
        const { character_ids, place_ids, ...storyPayload } = payload as any;

        const { data: story, error } = await supabaseAdmin
          .from('stories')
          .insert(storyPayload)
          .select()
          .single();
        if (error) throw error;

        await saveStoryRelations(String(story.id), characterIds, placeIds);
        res.status(200).json({ data: story });
        return;
      }
      case 'PATCH': {
        const id = req.query.id;
        if (!id || Array.isArray(id)) {
          res.status(400).json({ message: 'Missing id' });
          return;
        }

        const payload = getBody(req);
        const characterIds = normalizeIdArray((payload as any).character_ids);
        const placeIds = normalizeIdArray((payload as any).place_ids);
        const { character_ids, place_ids, ...storyPayload } = payload as any;

        const { data: story, error } = await supabaseAdmin
          .from('stories')
          .update(storyPayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;

        await saveStoryRelations(id, characterIds, placeIds);
        res.status(200).json({ data: story });
        return;
      }
      case 'DELETE': {
        const id = req.query.id;
        if (!id || Array.isArray(id)) {
          res.status(400).json({ message: 'Missing id' });
          return;
        }
        const { data, error } = await supabaseAdmin
          .from('stories')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw error;
        res.status(200).json({ data: data ?? null });
        return;
      }
      default: {
        res.status(405).json({ message: 'Method not allowed' });
        return;
      }
    }
  } catch (error: any) {
    res.status(500).json({ message: error?.message ?? 'Unknown error' });
  }
}

