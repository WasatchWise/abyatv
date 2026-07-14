'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, Link2, ArrowRight } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import {
  AGE_BANDS,
  extractPlatformId,
  looksLikeUrl,
  normalizeCategory,
  type Video,
} from '@/lib/videos';

/**
 * Search-first directory. Two modes, both first-class:
 *   1. "Is THIS one okay?" — paste a YouTube/TikTok URL, jump to its review.
 *   2. "What's good?" — search text + filter by age/category and browse.
 *
 * ZERO-PII: all state is anonymous UI state in React memory, mirrored into the
 * URL query string so a search or filtered view is itself bookmarkable and
 * shareable. The URL is the memory — nothing is written to localStorage,
 * cookies, or any store, and no query is ever tied to an identity.
 */
export function DirectoryClient({
  videos,
  categories,
}: {
  videos: Video[];
  categories: string[];
}) {
  const [query, setQuery] = useState('');
  const [ageBand, setAgeBand] = useState('all');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(48);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the view from the URL on mount, so a bookmarked/shared
  // /directory?q=…&age=…&cat= link opens exactly that view. The page itself
  // stays static (fast); this runs client-side only.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get('q');
    const age = p.get('age');
    const cat = p.get('cat');
    if (q) setQuery(q);
    if (age) setAgeBand(age);
    if (cat) setCategory(cat);
    setHydrated(true);
  }, []);

  // Mirror the current view into the URL (anonymous, shareable, bookmarkable).
  useEffect(() => {
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (ageBand !== 'all') p.set('age', ageBand);
    if (category !== 'all') p.set('cat', category);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `/directory?${qs}` : '/directory');
  }, [query, ageBand, category, hydrated]);

  // URL-paste mode: if the box holds a video URL, try to resolve it in-directory.
  const urlMatch = useMemo(() => {
    if (!looksLikeUrl(query)) return null;
    const pid = extractPlatformId(query);
    if (!pid) return { pid: null, video: null as Video | null };
    const video = videos.find((v) => v.platform_video_id === pid) ?? null;
    return { pid, video };
  }, [query, videos]);

  const filtered = useMemo(() => {
    // In URL-paste mode we don't run a text filter; the banner handles it.
    if (urlMatch) return [];
    const q = query.trim().toLowerCase();
    return videos.filter((v) => {
      if (ageBand !== 'all' && v.score_age_band !== ageBand) return false;
      if (category !== 'all') {
        const cats = (v.category_tags ?? []).map(normalizeCategory);
        if (!cats.includes(category)) return false;
      }
      if (q) {
        const hay = [
          v.title,
          v.parent_abstract ?? '',
          (v.topic_tags ?? []).join(' '),
          (v.category_tags ?? []).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [videos, query, ageBand, category, urlMatch]);

  const shown = filtered.slice(0, limit);
  const hasFilters = query || ageBand !== 'all' || category !== 'all';

  return (
    <div>
      {/* The tool, front and center. */}
      <div className="rounded-md border border-ink-500/60 bg-ink-800/70 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a title, or paste a YouTube / TikTok link…"
              className="w-full rounded-sm border border-ink-500 bg-ink px-11 py-3 text-[15px] text-paper placeholder:text-paper/40 focus:border-signal focus:outline-none"
              autoComplete="off"
              autoFocus
              aria-label="Search the directory or paste a video link"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              aria-label="Filter by age band"
              className="rounded-sm border border-ink-500 bg-ink px-3 py-3 font-mono text-xs uppercase tracking-wider text-paper focus:border-signal focus:outline-none"
            >
              <option value="all">All ages</option>
              {AGE_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="rounded-sm border border-ink-500 bg-ink px-3 py-3 font-mono text-xs uppercase tracking-wider text-paper focus:border-signal focus:outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!urlMatch && (
          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-paper/50">
              {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
              {hasFilters && ' match'}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setQuery('');
                  setAgeBand('all');
                  setCategory('all');
                }}
                className="font-mono text-xs uppercase tracking-widest text-amber hover:text-amber-bright"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* URL-paste verdict banner. */}
      {urlMatch && (
        <div className="mt-6">
          {urlMatch.video ? (
            <Link
              href={`/video/${urlMatch.video.id}`}
              className="dossier group flex items-center gap-4 border-signal/50 p-5 transition hover:border-signal"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-signal text-signal">
                <Link2 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs uppercase tracking-widest text-signal">
                  That link is in our directory
                </p>
                <p className="mt-1 truncate font-bold text-paper">{urlMatch.video.title}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-widest text-amber">
                Read the brief <ArrowRight size={14} />
              </span>
            </Link>
          ) : (
            <div className="dossier border-amber/30 p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-amber">
                Not in the directory yet
              </p>
              <p className="mt-1 text-sm text-paper/65">
                We recognized that as a video link, but it is not one of our
                vetted reviews yet. Try searching by title instead.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Browse results. */}
      {!urlMatch &&
        (shown.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
            {limit < filtered.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setLimit((n) => n + 48)}
                  className="rounded-sm border border-ink-500 px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper/80 transition hover:border-amber hover:text-amber"
                >
                  Load more ({filtered.length - limit} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="dossier mt-6 p-12 text-center">
            <p className="font-mono text-sm uppercase tracking-widest text-paper/50">
              No files match those filters.
            </p>
            <p className="mt-2 text-sm text-paper/40">Try widening the search or resetting.</p>
          </div>
        ))}
    </div>
  );
}
