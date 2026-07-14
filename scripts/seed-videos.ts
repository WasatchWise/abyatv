/**
 * abya.tv Directory Seeder — OFFLINE OPS TOOL, NOT PART OF THE WEB APP.
 *
 * Pulls videos from a curated channel list, scores each on the 10-dimension
 * rubric with Claude Haiku, writes a plain-language `parent_abstract`, and
 * upserts approved content into the ABYA_TV content tables. This is how the
 * public directory gets populated.
 *
 * ZERO-PII BOUNDARY: this script writes only vetted VIDEO and CHANNEL rows.
 * There is no person, account, or email anywhere in what it touches. It uses
 * the service-role key because it writes content, but it is run by hand from a
 * developer machine and is NEVER imported by the Next.js app. The deployed app
 * (app/, components/, lib/) has no service-role key and no write path. Keep it
 * that way: nothing in this file may be imported into the app.
 *
 * Usage:
 *   npx tsx scripts/seed-videos.ts
 *
 * Env vars required (ops env only, never NEXT_PUBLIC, never in Vercel app env):
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *   YOUTUBE_API_KEY, ANTHROPIC_API_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const YT_KEY = process.env.YOUTUBE_API_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Max videos to fetch per channel
const VIDEOS_PER_CHANNEL = 8;

// Delay between API calls (ms) to stay under rate limits
const DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Curated seed channels — safe, educational, high-quality
// ---------------------------------------------------------------------------

const SEED_CHANNELS: { id: string; name: string; tags: string[] }[] = [
  // === STEM ===
  { id: "UCsooa4yRKGN_zEE8iknghZA", name: "TED-Ed", tags: ["stem", "literacy", "arts", "history"] },
  { id: "UC9-y-6csu5WGm29I7JiwpnA", name: "Computerphile", tags: ["stem", "digital_citizenship"] },
  { id: "UCbfYPyITQ-7l4upoX8nvctg", name: "Two Minute Papers", tags: ["stem", "science"] },
  { id: "UC-EnprmCZ3OXyAoG7539th1Q", name: "Mark Rober", tags: ["stem", "maker", "engineering"] },
  { id: "UCO8DQrSp5yEP937qNqTooOw", name: "MIT OpenCourseWare", tags: ["stem", "math", "science"] },
  { id: "UCSIvk78tK2TiviLQn4fSHaw", name: "Up and Atom", tags: ["stem", "physics", "math"] },
  { id: "UCEIwxahdLz7bap-VDs9Q35RQ", name: "Tom Scott", tags: ["stem", "world_cultures", "history"] },
  { id: "UCvBqzzvUBLCs8Y7Axb-jZew", name: "Sixty Symbols", tags: ["stem", "physics"] },
  { id: "UC6107grRI4m0o2-emgoDnAA", name: "SmarterEveryDay", tags: ["stem", "science", "maker"] },
  { id: "UCHnyfMqiRRG1u-2MsSQLbXA", name: "Veritasium", tags: ["stem", "science", "experiments"] },
  { id: "UCZYTClx2T1of7BRZ86-8fow", name: "SciShow", tags: ["stem", "science"] },
  { id: "UC7_gcs09iThXybpVgjHZ_7g", name: "PBS Space Time", tags: ["stem", "physics", "space"] },
  { id: "UCsXVk37bltHxD1rDPwtNM8Q", name: "Kurzgesagt", tags: ["stem", "science", "animation"] },
  { id: "UC6nSFpj9HTCZ5t-N3Rm3-HA", name: "Vsauce", tags: ["stem", "science", "curiosity"] },
  { id: "UCYO_jab_esuFRV4b17AJtAw", name: "3Blue1Brown", tags: ["stem", "math", "animation"] },
  { id: "UCoxcjq-8xIDTYp3uz647V5A", name: "Numberphile", tags: ["stem", "math"] },
  { id: "UCX6b17PVsYBQ0ip5gyeme-Q", name: "CrashCourse", tags: ["stem", "history", "literacy"] },
  { id: "UCUHW94eEFW7hkUMVaZz4eDg", name: "MinutePhysics", tags: ["stem", "physics", "animation"] },
  { id: "UCGoyBKYGMg4JhGIKidVfHYg", name: "MinuteEarth", tags: ["stem", "nature", "animation"] },
  { id: "UCBbnbBWJtwsf0jLGdnOKkIA", name: "Steve Mould", tags: ["stem", "science", "experiments"] },
  { id: "UCJ0-OtVpF0wOKEqT2Z1HEtA", name: "ElectroBOOM", tags: ["stem", "engineering", "maker"] },
  { id: "UCivA7_KLKWo43tFcCkFvydw", name: "Applied Science", tags: ["stem", "engineering"] },
  { id: "UCMOqf8ab-42UUQIdVoKwjlQ", name: "Practical Engineering", tags: ["stem", "engineering"] },
  { id: "UCWnPjmqvljcafA0z2U1fwKQ", name: "Primer", tags: ["stem", "math", "animation"] },

  // === History & Culture ===
  { id: "UCNIuvl7V8zACPpTmmNIqP2A", name: "OverSimplified", tags: ["history", "animation", "humor"] },
  { id: "UCsXVk37bltHxD1rDPwtNM8Q", name: "Extra Credits", tags: ["history", "gaming", "animation"] },
  { id: "UCggB4c3_DVMa5CWwPnYPhow", name: "Kings and Generals", tags: ["history", "animation"] },
  { id: "UCX6b17PVsYBQ0ip5gyeme-Q", name: "CrashCourse History", tags: ["history", "literacy"] },
  { id: "UCVls1GmFKf6WlTraIb_IaJg", name: "HistoryMarche", tags: ["history", "animation"] },
  { id: "UCMjlDOf0UO9wSijFqPE9k1g", name: "Extra History (EC)", tags: ["history", "animation"] },
  { id: "UC22BVkDIC1vkal6pMASGloQ", name: "Sam O'Nella Academy", tags: ["history", "humor"] },
  { id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw", name: "PewDiePie", tags: ["gaming", "creative_expression"] },

  // === Nature & Geography ===
  { id: "UCpVm7bg6pXKo1Pr6k5kxG9A", name: "National Geographic", tags: ["nature", "science", "world_cultures"] },
  { id: "UCGaVdbSav8xWuFWTadK6loA", name: "KQED", tags: ["nature", "science"] },
  { id: "UCwu6uIEGSXKVRpq8LgDumSQ", name: "BBC Earth", tags: ["nature", "animals"] },
  { id: "UCInmGBWY3g1cBfAt1sZkhUQ", name: "Geography Now", tags: ["world_cultures", "history"] },
  { id: "UCHsRtomD4twRGoRSn_IiAEQ", name: "Brave Wilderness", tags: ["nature", "animals"] },
  { id: "UCGBzBkV-MinlBvHBzZawfLQ", name: "Moth Light Media", tags: ["nature", "stem", "animation"] },
  { id: "UCwmZiChSryoWQCZMIQezgTg", name: "Journey to the Microcosmos", tags: ["nature", "stem"] },

  // === Arts & Maker ===
  { id: "UCvjgXvBlCQM8Dg4tTAEYzCw", name: "Simone Giertz", tags: ["maker", "engineering", "humor"] },
  { id: "UC3KEoMzNz8eYnwBC34RaKCQ", name: "Wintergatan", tags: ["music", "maker", "engineering"] },
  { id: "UCfMJ2MchTSW2kWaT0kK94Yw", name: "William Osman", tags: ["maker", "engineering", "humor"] },
  { id: "UC67f2Qf7FYhtoULGRUqOpXA", name: "DIY Perks", tags: ["maker", "stem"] },
  { id: "UCkhZ3X6pVbrEs_VzIPfwWgQ", name: "I Like To Make Stuff", tags: ["maker", "arts"] },
  { id: "UCiDJtJKMICpb9B1qf7qjEOA", name: "Adam Savage's Tested", tags: ["maker", "stem", "arts"] },
  { id: "UCZB6V9fUov2Mha2j0qMKL3A", name: "Jazza", tags: ["arts", "creative_expression"] },
  { id: "UC0GhMDatlPjRT1JNwPasMGA", name: "Draw with Jazza", tags: ["arts", "creative_expression"] },

  // === Music ===
  { id: "UCnkp4xDOwqqJD7sSM3xdUiQ", name: "Adam Neely", tags: ["music", "stem"] },
  { id: "UCTUtqcDkzw7bisadh68yK5g", name: "12tone", tags: ["music", "stem", "animation"] },
  { id: "UCddiUEpeqJcYeBxX1IVBKvQ", name: "Vox", tags: ["stem", "world_cultures", "music"] },
  { id: "UCrzMRGdpRJkGFmhMACTJPbA", name: "Rick Beato", tags: ["music", "arts"] },

  // === Digital Citizenship & Social-Emotional ===
  { id: "UCPDXXXJj9nax0fr0Wfc048g", name: "Common Sense Education", tags: ["digital_citizenship"] },
  { id: "UC2C_jShtL725hvbm1arSV9w", name: "CGP Grey", tags: ["stem", "social_emotional", "history"] },
  { id: "UCg6gPGh8HU2U01vaFCAsvmQ", name: "School of Life", tags: ["social_emotional", "literacy"] },

  // === Gaming & general-interest (educational, well-vetted creators) ===
  { id: "UC_aEa8K-EOJ3D6gOs7HcyNg", name: "NoCopyrightSounds", tags: ["music"] },
  { id: "UCYzPXprvl5Y-Sf0g4vX-m6g", name: "Jared Owen", tags: ["stem", "animation", "maker"] },
  { id: "UCoC47do520os_4DBMEFGg4A", name: "Lemmino", tags: ["stem", "history", "creative_expression"] },
  { id: "UCHsRtomD4twRGoRSn_IiAEQ", name: "Coyote Peterson", tags: ["nature", "animals"] },
  { id: "UC4a-Gbdw7vOAccJiRmqHa0g", name: "Dude Perfect", tags: ["maker", "health"] },
  { id: "UCX11YFLm1WP3VqwYmFGrXGw", name: "How Ridiculous", tags: ["stem", "maker", "humor"] },

  // === Financial Literacy / Career ===
  { id: "UCnM5iMGiKsZg-iOlIO2ZkdQ", name: "The Infographics Show", tags: ["stem", "history", "world_cultures"] },
  { id: "UC4QZ_LsYcvcq7qOsOhpAI4A", name: "Graham Stephan", tags: ["financial_literacy", "career"] },
  { id: "UCWB7tSqGdemGGr7tu4YDbGQ", name: "How Money Works", tags: ["financial_literacy", "stem"] },
  { id: "UCkSi4VH4bp7iFkbWNPtlRTg", name: "Economics Explained", tags: ["financial_literacy", "stem"] },

  // === Health & Wellness ===
  { id: "UC68KSmHePPePCjW4v57VPQg", name: "Psych2Go", tags: ["health", "social_emotional"] },
  { id: "UCadiU6WTKl65HUwEih1XLYg", name: "Doctor Mike", tags: ["health", "stem"] },
];

// Deduplicate channels by ID
const CHANNELS = SEED_CHANNELS.filter(
  (ch, i, arr) => arr.findIndex((c) => c.id === ch.id) === i
);

// ---------------------------------------------------------------------------
// YouTube API helpers
// ---------------------------------------------------------------------------

async function ytFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set("key", YT_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API ${endpoint}: ${res.status} ${await res.text()}`);
  return res.json();
}

interface YTChannelInfo {
  subscriberCount: number;
  videoCount: number;
  avatarUrl: string;
}

async function fetchChannelInfo(channelId: string): Promise<YTChannelInfo> {
  const data = await ytFetch("channels", {
    part: "statistics,snippet",
    id: channelId,
  });
  const item = data.items?.[0];
  if (!item) throw new Error(`Channel not found: ${channelId}`);
  return {
    subscriberCount: parseInt(item.statistics.subscriberCount || "0"),
    videoCount: parseInt(item.statistics.videoCount || "0"),
    avatarUrl: item.snippet.thumbnails?.medium?.url || "",
  };
}

interface YTVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  channelTitle: string;
}

async function fetchChannelVideos(channelId: string, maxResults: number): Promise<YTVideo[]> {
  // Step 1: Get recent video IDs from search
  const searchData = await ytFetch("search", {
    part: "snippet",
    channelId,
    type: "video",
    order: "date",
    maxResults: String(maxResults),
    videoEmbeddable: "true",
  });

  const videoIds = (searchData.items || []).map((item: any) => item.id.videoId).filter(Boolean);
  if (videoIds.length === 0) return [];

  // Step 2: Get full details (including duration)
  const detailData = await ytFetch("videos", {
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
  });

  return (detailData.items || []).map((item: any) => ({
    videoId: item.id,
    title: item.snippet.title,
    description: (item.snippet.description || "").slice(0, 2000),
    thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "",
    publishedAt: item.snippet.publishedAt,
    durationSeconds: parseDuration(item.contentDetails.duration),
    channelTitle: item.snippet.channelTitle,
  }));
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 3600) +
    (parseInt(match[2] || "0") * 60) +
    parseInt(match[3] || "0");
}

// ---------------------------------------------------------------------------
// Claude scoring
// ---------------------------------------------------------------------------

const SCORING_PROMPT = `You are the abya.tv content vetting agent. abya.tv is a public review directory: for each video we publish a straight, plain-language read on what is actually in it, so a parent or a teacher knows before pressing play. You are writing that read.

Evaluate the video based on its title, description, channel context, and content tags. Score each dimension on a 1.0-5.0 scale (one decimal place).

SAFETY SCORES (1=dangerous, 5=perfectly safe):
- score_safety_content: Violence, frightening/disturbing content
- score_safety_language: Profanity, slurs, bullying language
- score_safety_sexual: Nudity, sexual themes or innuendo
- score_safety_substance: Drugs, alcohol, dangerous activities
- score_safety_bias: Propaganda, stereotyping, political manipulation

QUALITY SCORES (1=terrible, 5=excellent):
- score_quality_pedagogical: Clear learning outcome, teaches a skill or concept
- score_quality_accuracy: Factual correctness, well-researched
- score_quality_engagement: Holds attention through curiosity (NOT dark patterns/clickbait)
- score_quality_accessibility: Clear audio/visuals, captions likely, inclusive
- score_quality_creator: Creator trustworthiness, consistent quality, transparent

Also provide:
- parent_abstract: 2-3 sentences in plain English. Say what a viewer will actually see and learn, and name any concern, so a parent or teacher knows what is in it before pressing play. Factual and warm, not clinical. No em dashes.
- age_min: Minimum recommended age as an integer (for example "Ages 8+" = 8).
- score_age_band: One of "k2", "35", "68", "912", "1618"
- category_tags: Array of categories from: stem, arts, literacy, social_emotional, digital_citizenship, maker, music, nature, history, career, financial_literacy, creative_expression, health, world_cultures, current_events, gaming
- topic_tags: Array of 3-5 specific topic words (e.g. "medieval", "castles", "creative-mode")
- flags: Array of any concerns from: clickbait_thumbnail, rapid_cuts, loud_audio, autoplay_bait, misleading_title, sponsor_heavy, age_span_wide (or empty array)
- status_reason: One sentence on why this video should be approved or rejected.

Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "score_safety_content": 4.8,
  "score_safety_language": 5.0,
  "score_safety_sexual": 5.0,
  "score_safety_substance": 5.0,
  "score_safety_bias": 4.5,
  "score_quality_pedagogical": 4.2,
  "score_quality_accuracy": 4.7,
  "score_quality_engagement": 4.5,
  "score_quality_accessibility": 4.0,
  "score_quality_creator": 4.3,
  "parent_abstract": "This video walks through...",
  "age_min": 9,
  "score_age_band": "68",
  "category_tags": ["stem", "science"],
  "topic_tags": ["physics", "gravity", "experiments"],
  "flags": [],
  "status_reason": "High-quality educational content with no safety concerns."
}`;

interface ScoreResult {
  score_safety_content: number;
  score_safety_language: number;
  score_safety_sexual: number;
  score_safety_substance: number;
  score_safety_bias: number;
  score_quality_pedagogical: number;
  score_quality_accuracy: number;
  score_quality_engagement: number;
  score_quality_accessibility: number;
  score_quality_creator: number;
  parent_abstract: string;
  age_min: number;
  score_age_band: string;
  category_tags: string[];
  topic_tags: string[];
  flags: string[];
  status_reason: string;
}

async function scoreVideo(
  video: YTVideo,
  channelTags: string[]
): Promise<ScoreResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Score this YouTube video:\n\nTitle: ${video.title}\nChannel: ${video.channelTitle}\nChannel Tags: ${channelTags.join(", ")}\nDuration: ${Math.round(video.durationSeconds / 60)} minutes\nPublished: ${video.publishedAt}\nDescription: ${video.description.slice(0, 1000)}`,
        },
      ],
      system: SCORING_PROMPT,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON from response, stripping any markdown fences
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

function computeComposite(s: ScoreResult): number {
  // Weighted average matching Paul's rubric (adapted to 1-5 scale)
  // Safety dimensions weighted more heavily for younger audiences
  const safetyAvg =
    (s.score_safety_content + s.score_safety_language + s.score_safety_sexual +
      s.score_safety_substance + s.score_safety_bias) / 5;
  const qualityAvg =
    (s.score_quality_pedagogical + s.score_quality_accuracy +
      s.score_quality_engagement + s.score_quality_accessibility +
      s.score_quality_creator) / 5;

  // 60% safety, 40% quality
  return Math.round((safetyAvg * 0.6 + qualityAvg * 0.4) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Supabase upsert helpers
// ---------------------------------------------------------------------------

async function upsertChannel(
  channel: (typeof CHANNELS)[0],
  info: YTChannelInfo
): Promise<string> {
  const { data, error } = await supabase
    .from("abya_channels")
    .upsert(
      {
        name: channel.name,
        platform: "youtube",
        platform_id: channel.id,
        platform_url: `https://www.youtube.com/channel/${channel.id}`,
        avatar_url: info.avatarUrl,
        subscriber_count: info.subscriberCount,
        video_count: info.videoCount,
        trust_tier: "standard", // Approved channels start at standard
        trust_reason: "Curated seed channel for ABYA.tv launch",
        primary_audience_min_age: 8,
        content_tags: channel.tags,
        content_language: "en",
        last_scanned_at: new Date().toISOString(),
      },
      { onConflict: "platform,platform_id" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Channel upsert failed (${channel.name}): ${error.message}`);
  return data.id;
}

async function upsertVideo(
  video: YTVideo,
  channelId: string,
  scores: ScoreResult,
  composite: number
): Promise<string> {
  const shouldApprove = composite >= 3.2 && scores.flags.filter(f => f !== "sponsor_heavy").length === 0;

  const { data, error } = await supabase
    .from("abya_videos")
    .upsert(
      {
        channel_id: channelId,
        title: video.title,
        description: video.description,
        source_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        platform: "youtube",
        platform_video_id: video.videoId,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        published_at: video.publishedAt,
        parent_abstract: scores.parent_abstract,
        age_min: scores.age_min,
        category_tags: scores.category_tags,
        topic_tags: scores.topic_tags,
        score_safety_content: scores.score_safety_content,
        score_safety_language: scores.score_safety_language,
        score_safety_sexual: scores.score_safety_sexual,
        score_safety_substance: scores.score_safety_substance,
        score_safety_bias: scores.score_safety_bias,
        score_quality_pedagogical: scores.score_quality_pedagogical,
        score_quality_accuracy: scores.score_quality_accuracy,
        score_quality_engagement: scores.score_quality_engagement,
        score_quality_accessibility: scores.score_quality_accessibility,
        score_quality_creator: scores.score_quality_creator,
        score_composite: composite,
        score_age_band: scores.score_age_band,
        status: shouldApprove ? "approved" : "scored",
        status_reason: scores.status_reason,
        flags: scores.flags,
        scored_at: new Date().toISOString(),
        scored_by: "claude-haiku-4-5",
        score_prompt_version: "v1",
        approved_at: shouldApprove ? new Date().toISOString() : null,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
      { onConflict: "platform,platform_video_id" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Video upsert failed (${video.title}): ${error.message}`);
  return data.id;
}

async function logVetting(videoId: string, channelId: string, action: string, details: any) {
  await supabase.from("abya_vetting_log").insert({
    video_id: videoId,
    channel_id: channelId,
    action,
    actor: "pipeline:v1",
    details,
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Validate env
  for (const [name, val] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY,
    YOUTUBE_API_KEY: YT_KEY,
    ANTHROPIC_API_KEY: ANTHROPIC_KEY,
  })) {
    if (!val) {
      console.error(`Missing env var: ${name}`);
      process.exit(1);
    }
  }

  console.log(`\nabya.tv Directory Seeder`);
  console.log(`   ${CHANNELS.length} channels, up to ${VIDEOS_PER_CHANNEL} videos each\n`);

  let totalVideos = 0;
  let totalApproved = 0;
  let totalErrors = 0;

  for (const channel of CHANNELS) {
    console.log(`\n📺 ${channel.name} (${channel.id})`);

    try {
      // Fetch channel info
      const info = await fetchChannelInfo(channel.id);
      console.log(`   ${info.subscriberCount.toLocaleString()} subs, ${info.videoCount} videos`);

      // Upsert channel
      const channelDbId = await upsertChannel(channel, info);
      console.log(`   Channel upserted: ${channelDbId}`);

      await sleep(DELAY_MS);

      // Fetch recent videos
      const videos = await fetchChannelVideos(channel.id, VIDEOS_PER_CHANNEL);
      console.log(`   Found ${videos.length} videos`);

      for (const video of videos) {
        try {
          // Skip shorts (under 60 seconds)
          if (video.durationSeconds < 60) {
            console.log(`   ⏭ Skipping short: ${video.title} (${video.durationSeconds}s)`);
            continue;
          }

          // Check if already exists
          const { data: existing } = await supabase
            .from("abya_videos")
            .select("id")
            .eq("platform_video_id", video.videoId)
            .single();

          if (existing) {
            console.log(`   ⏭ Already exists: ${video.title}`);
            continue;
          }

          console.log(`   🔍 Scoring: ${video.title}`);

          // Score with Claude
          const scores = await scoreVideo(video, channel.tags);
          const composite = computeComposite(scores);
          const approved = composite >= 3.2 && scores.flags.filter(f => f !== "sponsor_heavy").length === 0;

          console.log(`      Score: ${composite} | Age: ${scores.age_min}+ | ${approved ? "✅ APPROVED" : "⚠️  NEEDS REVIEW"}`);
          if (scores.flags.length > 0) console.log(`      Flags: ${scores.flags.join(", ")}`);

          // Insert video
          const videoDbId = await upsertVideo(video, channelDbId, scores, composite);

          // Log vetting action
          await logVetting(videoDbId, channelDbId, approved ? "auto_approved" : "scored", {
            composite,
            flags: scores.flags,
            age_band: scores.score_age_band,
          });

          totalVideos++;
          if (approved) totalApproved++;

          await sleep(DELAY_MS);
        } catch (err: any) {
          console.error(`   ❌ Error scoring ${video.title}: ${err.message}`);
          totalErrors++;
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Channel error: ${err.message}`);
      totalErrors++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done! ${totalVideos} videos processed, ${totalApproved} approved, ${totalErrors} errors`);

  // Final count
  const { count: videoCount } = await supabase
    .from("abya_videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: channelCount } = await supabase
    .from("abya_channels")
    .select("*", { count: "exact", head: true });

  console.log(`Total in DB: ${videoCount} approved videos across ${channelCount} channels\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
