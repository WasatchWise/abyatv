import { createReadOnlyClient } from './supabase';

/**
 * The vetted-video directory — "Ask Before You App -> Ask Before You Play."
 * The product is `parent_abstract`: a plain-language "here's what's in this
 * video" summary so a parent or teacher knows before pressing play.
 *
 * We select ONLY the columns the public directory needs. No PII exists in this
 * table, but we stay minimal on principle.
 */
export type Video = {
  id: string;
  title: string;
  source_url: string;
  platform: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  age_min: number | null;
  parent_abstract: string | null;
  category_tags: string[] | null;
  topic_tags: string[] | null;
  score_composite: number | null;
  score_age_band: string | null;
};

const SELECT =
  'id,title,source_url,platform,thumbnail_url,duration_seconds,age_min,parent_abstract,category_tags,topic_tags,score_composite,score_age_band';

export async function fetchVideos(): Promise<Video[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from('abya_videos')
    .select(SELECT)
    .eq('status', 'approved')
    .order('score_composite', { ascending: false, nullsFirst: false });

  if (error) {
    // Surface the real error server-side; render an honest empty state upstream.
    console.error('[abya.tv] fetchVideos failed:', error.message);
    return [];
  }
  return (data as Video[]) ?? [];
}

/** Age bands as stored in `score_age_band`, mapped to human labels. */
export const AGE_BANDS: { value: string; label: string }[] = [
  { value: 'k2', label: 'K–2' },
  { value: '35', label: 'Grades 3–5' },
  { value: '68', label: 'Grades 6–8' },
  { value: '912', label: 'Grades 9–12' },
  { value: '1618', label: 'Ages 16–18' },
];

export function ageBandLabel(band: string | null): string {
  if (!band) return 'All ages';
  return AGE_BANDS.find((b) => b.value === band)?.label ?? band;
}

/**
 * Category tags in the data are inconsistently cased (stem / STEM / Science /
 * science). Normalize to a clean, human display label and merge duplicates.
 */
export function normalizeCategory(tag: string): string {
  const key = tag.toLowerCase().replace(/[\s_]+/g, ' ').trim();
  const MAP: Record<string, string> = {
    stem: 'STEM',
    math: 'Math',
    mathematics: 'Math',
    science: 'Science',
    physics: 'Physics',
    engineering: 'Engineering',
    history: 'History',
    'social emotional': 'Social & Emotional',
    'digital citizenship': 'Digital Citizenship',
    'creative expression': 'Creative Expression',
    maker: 'Maker',
    career: 'Career',
    nature: 'Nature',
    health: 'Health',
    'world cultures': 'World Cultures',
    arts: 'Arts',
    literacy: 'Literacy',
    music: 'Music',
    'current events': 'Current Events',
    educational: 'Educational',
    animation: 'Animation',
    gaming: 'Gaming',
    documentary: 'Documentary',
    preschool: 'Preschool',
    entertainment: 'Entertainment',
  };
  return MAP[key] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Top categories across the set, for the filter bar. */
export function topCategories(videos: Video[], limit = 14): string[] {
  const counts = new Map<string, number>();
  for (const v of videos) {
    for (const raw of v.category_tags ?? []) {
      const label = normalizeCategory(raw);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label]) => label);
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
