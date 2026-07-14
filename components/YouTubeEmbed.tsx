'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';

/* Minimal YT IFrame API surface we use. */
type YTPlayer = {
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  destroy?: () => void;
};
declare global {
  interface Window {
    YT?: {
      Player: new (el: Element, opts: unknown) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: (() => void) | undefined;
  }
}

/* Load the IFrame API once, on demand (only after the user presses play). */
let ytApi: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApi) return ytApi;
  ytApi = new Promise<void>((resolve) => {
    const prior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prior?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytApi;
}

/**
 * Click-to-play YouTube embed that stays ON RAILS.
 *
 * ZERO-PII: on load it renders ONLY a thumbnail + play button and contacts
 * YouTube zero times. The player (via youtube-nocookie host) mounts only after
 * the visitor presses play.
 *
 * NO UNVETTED CREEP: rel=0 keeps any in-player suggestions to the SAME vetted
 * channel; iv_load_policy=3 hides annotation cards; and the moment the video
 * ENDS we cover the frame with our own end card, so YouTube's suggested-video
 * grid is never the thing a parent or teacher sees or can click.
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
  const [ended, setEnded] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const thumb = poster || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  useEffect(() => {
    if (!playing || !mountRef.current) return;
    let cancelled = false;
    // A manually-created host node (outside React's tree) for YT to replace,
    // so the API swapping it for an iframe never fights React reconciliation.
    const host = document.createElement('div');
    host.style.width = '100%';
    host.style.height = '100%';
    mountRef.current.appendChild(host);

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(host, {
        videoId,
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          rel: 0, // suggestions limited to the same (vetted) channel
          modestbranding: 1,
          iv_load_policy: 3, // no annotation/info cards
          playsinline: 1,
          fs: 1,
          color: 'white',
        },
        events: {
          onStateChange: (e: { data: number }) => {
            const YT = window.YT;
            if (!YT) return;
            if (e.data === YT.PlayerState.ENDED) setEnded(true);
            else if (e.data === YT.PlayerState.PLAYING) setEnded(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* player already gone */
      }
      playerRef.current = null;
    };
  }, [playing, videoId]);

  const replay = useCallback(() => {
    setEnded(false);
    try {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.playVideo();
    } catch {
      /* noop */
    }
  }, []);

  if (!playing) {
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

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-ink">
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {ended && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-ink/95 px-6 text-center backdrop-blur-sm">
          <span className="label text-signal">End of file</span>
          <p className="max-w-sm text-sm leading-relaxed text-paper/60">
            That’s the whole clip. No autoplay, no rabbit hole. You decide what’s
            next.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={replay}
              className="inline-flex items-center gap-2 rounded-sm border border-ink-500 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper/80 transition hover:border-amber hover:text-amber"
            >
              <RotateCcw size={14} /> Replay
            </button>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-sm bg-amber px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-amber-bright"
            >
              Back to the directory <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
