import { supabase } from './supabaseClient';
import { ChronicleEntry } from '../types';

interface TimelineEventRow {
  id: string;
  title: string;
  date_label: string | null;
  summary: string | null;
  status: string;
}

const mapTimelineEvent = (row: TimelineEventRow): ChronicleEntry => ({
  id: row.id,
  title: row.title,
  date: row.date_label ?? '',
  summary: row.summary ?? '',
  status: row.status as ChronicleEntry['status'],
});

export const listTimelineEvents = async (): Promise<ChronicleEntry[]> => {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as TimelineEventRow[]) ?? []).map(mapTimelineEvent);
};

