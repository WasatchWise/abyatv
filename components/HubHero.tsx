import { PlayCircle } from 'lucide-react';
import { HeroSearch } from '@/components/HeroSearch';

const HUB_VIDEO_URL =
  process.env.NEXT_PUBLIC_HUB_VIDEO_URL ??
  'https://media.askbeforeyouapp.com/hub-intro-five-pillars-v4.mp4';

/**
 * The one on-site hub video: the five-pillars intro (4:07, on R2).
 * Plays right here, anonymously. This is the only long-form piece that lives
 * on abya.tv itself.
 */
export function HubHero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-500/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <span className="stamp">Case File // Public Clearance</span>
            <h1 className="mt-6 font-mono text-4xl font-bold leading-tight tracking-tight text-paper sm:text-5xl">
              Ask before you{' '}
              <span className="text-amber">play</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/70">
              Every video in our directory carries a plain-language brief. A
              straight read on what is actually in it, so a parent or a teacher
              knows before pressing play. Free, public, and anonymous. There is
              no account here, and there never will be.
            </p>
            {/* Search-first: the fastest path to a verdict is right here. */}
            <HeroSearch />

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href="/directory"
                className="inline-flex items-center gap-2 rounded-sm border border-ink-500 px-6 py-3 font-mono text-sm uppercase tracking-widest text-paper/80 transition hover:border-amber hover:text-amber"
              >
                Browse the Directory
              </a>
              <a
                href="#tracks"
                className="inline-flex items-center gap-2 rounded-sm border border-ink-500 px-6 py-3 font-mono text-sm uppercase tracking-widest text-paper/80 transition hover:border-amber hover:text-amber"
              >
                The Case Files
              </a>
            </div>
          </div>

          {/* The hub intro video — the only self-hosted long-form piece. */}
          <div className="animate-fade-up">
            <div className="dossier grain relative overflow-hidden shadow-dossier">
              <div className="flex items-center justify-between border-b border-ink-500/50 px-4 py-2">
                <span className="label text-amber">EXHIBIT&nbsp;00 · HUB INTRO</span>
                <span className="label flex items-center gap-1 text-paper/50">
                  <PlayCircle size={14} /> 4:07
                </span>
              </div>
              <video
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-ink"
                poster="/hub-poster.svg"
              >
                <source src={HUB_VIDEO_URL} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <p className="border-t border-ink-500/50 px-4 py-3 text-sm text-paper/60">
                The five pillars, in four minutes. Start here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
