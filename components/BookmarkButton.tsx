'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { isBookmarked, onBookmarksChanged, toggleBookmark } from '@/lib/bookmarks';

/**
 * Save a review to this device. Device-local IndexedDB only — see
 * lib/bookmarks.ts for the zero-PII contract.
 */
export function BookmarkButton({
  videoId,
  label = false,
}: {
  videoId: string;
  /** true = full button with text (review page); false = icon-only (cards). */
  label?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      isBookmarked(videoId).then((v) => {
        if (alive) {
          setSaved(v);
          setReady(true);
        }
      });
    refresh();
    const off = onBookmarksChanged(refresh);
    return () => {
      alive = false;
      off();
    };
  }, [videoId]);

  const onClick = async (e: React.MouseEvent) => {
    // Cards wrap this in links; don't navigate when saving.
    e.preventDefault();
    e.stopPropagation();
    setSaved(await toggleBookmark(videoId));
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  const title = saved ? 'Saved on this device — tap to remove' : 'Save on this device';

  if (label) {
    return (
      <button
        onClick={onClick}
        title={title}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition ${
          saved
            ? 'border-signal text-signal'
            : 'border-ink-500 text-paper/70 hover:border-signal hover:text-signal'
        }`}
      >
        <Icon size={14} /> {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={saved}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded-sm border px-3 py-2 transition ${
        saved
          ? 'border-signal text-signal'
          : 'border-ink-500 text-paper/60 hover:border-signal hover:text-signal'
      } ${ready ? '' : 'opacity-60'}`}
    >
      <Icon size={13} />
    </button>
  );
}
