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
  /** YouTube/TikTok video id — lets us resolve a pasted URL to a review page. */
  platform_video_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  age_min: number | null;
  parent_abstract: string | null;
  category_tags: string[] | null;
  topic_tags: string[] | null;
  score_composite: number | null;
  score_age_band: string | null;
};

/** Full detail for a single review page (adds description, flags, subscores). */
export type VideoDetail = Video & {
  description: string | null;
  flags: string[] | null;
  score_safety_content: number | null;
  score_safety_language: number | null;
  score_safety_sexual: number | null;
  score_safety_substance: number | null;
  score_safety_bias: number | null;
  score_quality_pedagogical: number | null;
  score_quality_accuracy: number | null;
  score_quality_engagement: number | null;
  score_quality_accessibility: number | null;
  score_quality_creator: number | null;
  channel_id: string | null;
  channel_name: string | null;
};

const SELECT =
  'id,title,source_url,platform,platform_video_id,thumbnail_url,duration_seconds,age_min,parent_abstract,category_tags,topic_tags,score_composite,score_age_band';

const DETAIL_SELECT =
  SELECT +
  ',description,flags,channel_id,' +
  'score_safety_content,score_safety_language,score_safety_sexual,score_safety_substance,score_safety_bias,' +
  'score_quality_pedagogical,score_quality_accuracy,score_quality_engagement,score_quality_accessibility,score_quality_creator,' +
  'abya_channels(name)';

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

/** One video's full review detail, by id. Returns null if not found/approved. */
export async function fetchVideoById(id: string): Promise<VideoDetail | null> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from('abya_videos')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[abya.tv] fetchVideoById failed:', error.message);
    return null;
  }
  const row = data as unknown as Record<string, unknown>;
  const rawChannel = row.abya_channels as { name: string } | { name: string }[] | null;
  const channel = Array.isArray(rawChannel) ? rawChannel[0] : rawChannel;
  return { ...(row as unknown as VideoDetail), channel_name: channel?.name ?? null };
}

/** Other approved videos from the same channel, for the "more like this" rail. */
export async function fetchRelated(channelId: string | null, excludeId: string): Promise<Video[]> {
  if (!channelId) return [];
  const supabase = createReadOnlyClient();
  const { data } = await supabase
    .from('abya_videos')
    .select(SELECT)
    .eq('channel_id', channelId)
    .eq('status', 'approved')
    .neq('id', excludeId)
    .order('score_composite', { ascending: false, nullsFirst: false })
    .limit(4);
  return (data as Video[]) ?? [];
}

/** All approved video ids — for static generation of review pages. */
export async function fetchAllVideoIds(): Promise<string[]> {
  const supabase = createReadOnlyClient();
  const { data } = await supabase
    .from('abya_videos')
    .select('id')
    .eq('status', 'approved');
  return (data as { id: string }[] | null)?.map((r) => r.id) ?? [];
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

/**
 * Pull a platform video id out of a pasted URL (YouTube or TikTok). Lets a
 * teacher paste the exact link they were handed and jump straight to the
 * review. Returns null when the string is not a recognizable video URL.
 */
export function extractPlatformId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // Bare 11-char YouTube id pasted on its own.
  if (/^[\w-]{11}$/.test(s) && !s.includes('.')) return s;
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const m = url.pathname.match(/\/(?:embed|shorts|v)\/([\w-]+)/);
      if (m) return m[1];
    }
    if (host.endsWith('tiktok.com')) {
      const m = url.pathname.match(/\/video\/(\d+)/);
      if (m) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}

/** Does this look like a URL the user pasted (vs. a plain text search)? */
export function looksLikeUrl(input: string): boolean {
  const s = input.trim();
  return /^(https?:\/\/|www\.)/i.test(s) || /(youtu\.be|youtube\.com|tiktok\.com)/i.test(s) ||
    (/^[\w-]{11}$/.test(s) && !s.includes(' '));
}

/** Subscores shown as bars on the review page. */
export const SCORE_ROWS: { key: keyof VideoDetail; label: string }[] = [
  { key: 'score_safety_content', label: 'Content safety' },
  { key: 'score_safety_language', label: 'Language' },
  { key: 'score_safety_sexual', label: 'Sexual content' },
  { key: 'score_safety_substance', label: 'Substances / risk' },
  { key: 'score_quality_pedagogical', label: 'Educational value' },
  { key: 'score_quality_accuracy', label: 'Accuracy' },
  { key: 'score_quality_engagement', label: 'Healthy engagement' },
];

/** Color for a 1-5 score: green safe, amber caution, red concern. */
export function scoreColor(score: number): string {
  if (score >= 4.5) return '#7CFC4D'; // acid-safe green
  if (score >= 3.8) return '#FFB347'; // amber caution
  return '#e06a5c'; // concern
}

/** Turn a snake_case flag into a readable phrase. */
export function flagLabel(flag: string): string {
  return flag.replace(/_/g, ' ');
}
