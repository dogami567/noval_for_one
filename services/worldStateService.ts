import { supabase } from './supabaseClient';

interface WorldStateRow {
  id: string;
  summary: string | null;
  memory: unknown;
  updated_at: string | null;
  source: string | null;
}

export const getWorldState = async (): Promise<WorldStateRow | null> => {
  const { data, error } = await supabase
    .from('world_state')
    .select('*')
    .eq('id', 'global')
    .maybeSingle();

  if (error) throw error;
  return (data as WorldStateRow) ?? null;
};

