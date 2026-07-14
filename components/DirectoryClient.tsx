'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import {
  AGE_BANDS,
  normalizeCategory,
  type Video,
} from '@/lib/videos';

/**
 * Client-side search + filter over the pre-fetched directory.
 *
 * ZERO-PII: all state is anonymous UI state held in React memory only. Nothing
 * is written to localStorage, cookies, or any store. No query is logged with an
 * identity. Refresh the page and it all resets, by design.
 */
export function DirectoryClient({
  videos,
  categories,
}: {
  videos: Video[];
  categories: string[];
}) {
  const [query, setQuery] = useState('');
  const [ageBand, setAgeBand] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [limit, setLimit] = useState(48);

  const filtered = useMemo(() => {
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
  }, [videos, query, ageBand, category]);

  const shown = filtered.slice(0, limit);
  const hasFilters = query || ageBand !== 'all' || category !== 'all';

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-[57px] z-30 -mx-4 border-b border-ink-500/40 bg-ink-800/90 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-md sm:border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, briefs, topics…"
              className="w-full rounded-sm border border-ink-500 bg-ink px-9 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:border-signal focus:outline-none"
              autoComplete="off"
              aria-label="Search the directory"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              aria-label="Filter by age band"
              className="rounded-sm border border-ink-500 bg-ink px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-paper focus:border-signal focus:outline-none"
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
              className="rounded-sm border border-ink-500 bg-ink px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-paper focus:border-signal focus:outline-none"
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
      </div>

      {/* Results */}
      {shown.length > 0 ? (
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
      )}
    </div>
  );
}
