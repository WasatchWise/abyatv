'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Click-to-play YouTube facade. ZERO-PII BY DESIGN:
 *
 * On load, this renders ONLY a thumbnail + play button. It makes NO request to
 * YouTube, sets no cookie, loads no tracker — abya.tv's "we collect nothing"
 * promise holds on every page view. The YouTube iframe (in privacy-enhanced
 * youtube-nocookie mode) is mounted ONLY after the visitor presses play, i.e.
 * only when they choose to watch. Nothing about them is ever stored by us.
 */
export function YouTubeEmbed({
  videoId,
  title,
  poster,
}: {
  videoId: string;
  title: string;
  poster?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const thumb = poster || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden bg-ink"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt=""
        className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:opacity-100"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition group-hover:bg-ink/20">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber bg-ink/70 text-amber transition duration-300 group-hover:scale-110 group-hover:bg-amber group-hover:text-ink">
          <Play size={26} className="ml-1" fill="currentColor" />
        </span>
      </div>
      <span className="label absolute bottom-2 left-2 rounded-sm bg-ink/80 px-2 py-1 text-signal">
        Press play · nothing loads from YouTube until you do
      </span>
    </button>
  );
}
