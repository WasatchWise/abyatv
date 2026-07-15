import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { ageBandLabel, formatDuration, normalizeCategory, thumbUrl, type Video } from '@/lib/videos';

/**
 * A directory entry. The `parent_abstract` is the point — shown prominently so
 * a parent or teacher knows what is in the video before pressing play.
 *
 * The whole card links to the review page (/video/[id]) — that clean URL is the
 * thing people bookmark and paste into staff emails and parent texts. The
 * "Watch on YouTube" link is a secondary action that opens the source directly.
 */
export function VideoCard({ video }: { video: Video }) {
  const duration = formatDuration(video.duration_seconds);
  const cats = (video.category_tags ?? [])
    .map(normalizeCategory)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3);

  return (
    <article className="dossier group flex flex-col overflow-hidden transition hover:border-signal/50">
      <Link href={`/video/${video.id}`} className="block" aria-label={`Review: ${video.title}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-ink">
          {/* First-party proxy — the browser never contacts Google. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl(video.platform_video_id)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          {duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-ink/90 px-1.5 py-0.5 font-mono text-[0.65rem] text-paper/80">
              {duration}
            </span>
          )}
          <span className="absolute left-1.5 top-1.5 rounded bg-signal/90 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink">
            {ageBandLabel(video.score_age_band)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/video/${video.id}`} className="block">
          <h3 className="line-clamp-2 font-bold leading-snug text-paper transition group-hover:text-signal">
            {video.title}
          </h3>

          {/* The product: the plain-language brief. */}
          {video.parent_abstract && (
            <div className="mt-3 border-l-2 border-signal/50 pl-3">
              <p className="label text-signal/80">The brief</p>
              <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-paper/70">
                {video.parent_abstract}
              </p>
            </div>
          )}
        </Link>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <span
              key={c}
              className="rounded-full border border-ink-500 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-paper/50"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/video/${video.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-ink-500 py-2 font-mono text-xs uppercase tracking-widest text-paper/80 transition hover:border-signal hover:text-signal"
          >
            <FileText size={13} /> Read the brief
          </Link>
          <a
            href={video.source_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch on the original platform"
            className="inline-flex items-center justify-center gap-1 rounded-sm border border-ink-500 px-3 py-2 font-mono text-xs uppercase tracking-widest text-paper/60 transition hover:border-amber hover:text-amber"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}
