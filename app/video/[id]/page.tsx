import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  fetchVideoById,
  fetchRelated,
  fetchAllVideoIds,
  ageBandLabel,
  formatDuration,
  normalizeCategory,
  scoreColor,
  flagLabel,
  SCORE_ROWS,
  type VideoDetail,
} from '@/lib/videos';
import { VideoCard } from '@/components/VideoCard';
import { TrustBadge } from '@/components/TrustBadge';

// Static-render every review page for speed; re-check the vetted set hourly.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await fetchAllVideoIds();
  return ids.map((id) => ({ id }));
}

// OG/meta so a pasted link unfurls with the title + brief + thumbnail in
// Slack / iMessage / email. The shareable URL is the substitute for an account.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideoById(id);
  if (!video) return { title: 'Review not found' };
  const desc = video.parent_abstract ?? 'A plain-language review of what is in this video.';
  return {
    title: `${video.title} · the brief`,
    description: desc,
    openGraph: {
      title: video.title,
      description: desc,
      url: `https://abya.tv/video/${id}`,
      type: 'article',
      images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: desc,
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
    },
  };
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 font-mono text-[0.7rem] uppercase tracking-wider text-paper/50">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-600/60">
        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, background: color }} />
      </div>
      <span className="w-8 text-right font-mono text-xs font-bold" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default async function VideoReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await fetchVideoById(id);
  if (!video) notFound();

  const related = await fetchRelated(video.channel_id, id);
  const composite = video.score_composite ?? 0;
  const cats = (video.category_tags ?? [])
    .map(normalizeCategory)
    .filter((v, i, a) => a.indexOf(v) === i);
  const flags = (video.flags ?? []).filter((f) => f !== 'sponsor_heavy');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/directory"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-paper/60 transition hover:text-amber"
      >
        <ArrowLeft size={14} /> Back to the directory
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main dossier */}
        <div>
          <span className="label text-signal/80">
            {video.platform === 'youtube' ? 'YouTube' : video.platform} · Ask Before You Play
          </span>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-paper sm:text-3xl">
            {video.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-paper/50">
            {video.channel_name && <span>{video.channel_name}</span>}
            {video.duration_seconds ? (
              <>
                <span className="text-paper/25">·</span>
                <span>{formatDuration(video.duration_seconds)}</span>
              </>
            ) : null}
            <span className="text-paper/25">·</span>
            <span className="rounded bg-signal/15 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-signal">
              {ageBandLabel(video.score_age_band)}
            </span>
          </div>

          {/* The verdict, up top — thumbnail + brief. */}
          <div className="dossier mt-6 overflow-hidden">
            {video.thumbnail_url && (
              <div className="relative aspect-video w-full overflow-hidden bg-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className="label text-signal/80">The brief</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-paper/85">
                {video.parent_abstract ?? 'No brief is available for this video yet.'}
              </p>

              <a
                href={video.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-sm bg-amber px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-amber-bright"
              >
                Watch on {video.platform === 'youtube' ? 'YouTube' : video.platform}
                <ExternalLink size={14} />
              </a>
              <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-paper/35">
                Opens on the original platform · abya.tv never hosts the video
              </p>
            </div>
          </div>

          {/* Content notes / flags */}
          {flags.length > 0 && (
            <div className="mt-5 rounded-md border border-amber/30 bg-amber/5 p-4">
              <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-amber">
                <AlertTriangle size={14} /> Content notes
              </p>
              <ul className="mt-2 space-y-1">
                {flags.map((f) => (
                  <li key={f} className="text-sm capitalize text-paper/60">
                    · {flagLabel(f)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Topic tags */}
          {(video.topic_tags ?? []).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {(video.topic_tags ?? []).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-ink-500 px-2.5 py-0.5 font-mono text-[0.65rem] lowercase tracking-wider text-paper/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score sidebar */}
        <aside className="space-y-6">
          <div className="dossier p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-sm font-bold text-paper">
                <ShieldCheck size={16} className="text-signal" /> ABYA score
              </span>
              <span
                className="font-mono text-2xl font-bold"
                style={{ color: scoreColor(composite) }}
              >
                {composite.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-paper/40">
              vetted on a 10-point rubric · 5.0 is best
            </p>
            <div className="mt-4 space-y-2.5">
              {SCORE_ROWS.map((row) => {
                const v = video[row.key];
                if (typeof v !== 'number') return null;
                return <ScoreBar key={row.key as string} label={row.label} score={v} />;
              })}
            </div>
          </div>

          {cats.length > 0 && (
            <div className="dossier p-5">
              <p className="label text-paper/40">Categories</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cats.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ink-500 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-paper/60"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <TrustBadge compact />
        </aside>
      </div>

      {/* More from this channel */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-mono text-lg font-bold text-paper">
            More from {video.channel_name ?? 'this channel'}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
