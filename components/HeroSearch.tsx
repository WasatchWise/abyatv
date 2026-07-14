'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Fast entry from the homepage into the directory tool. Submitting routes to
 * /directory?q=… — a title search or a pasted YouTube/TikTok link both work
 * (the directory resolves a link to its review). Anonymous: the query only ever
 * lives in the URL, never stored.
 */
export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/directory?q=${encodeURIComponent(q)}` : '/directory');
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="relative max-w-xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper/40"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a title, or paste a YouTube / TikTok link…"
          aria-label="Search the directory or paste a video link"
          autoComplete="off"
          className="w-full rounded-sm border border-ink-500 bg-ink/80 py-3 pl-11 pr-28 text-[15px] text-paper placeholder:text-paper/40 focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm bg-amber px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-amber-bright"
        >
          Check it
        </button>
      </div>
    </form>
  );
}
