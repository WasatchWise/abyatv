import { GATED_EPISODES } from '@/lib/tracks';
import { ArrowUpRight } from 'lucide-react';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL ?? 'https://askbeforeyouapp.com';

/**
 * Gated episodes render as CARDS, NOT players. Every click navigates to the
 * Agency apex (never a district subdomain). That click is the handoff to where
 * membership and identity live. abya.tv shows title + CTA and sends the visitor
 * off-site. Nothing plays here.
 *
 * Villain art is canonical League of Gaps (THE TRACKER, THE BROKER), rendered
 * as a darkened silhouette behind a black redaction bar with the BreachCorp
 * acid-green corruption glow. Canon: no invented rogues, silhouette only.
 */
export function GatedEpisodes() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="episodes">
      <div className="mb-10">
        <span className="stamp border-acid text-acid">Classified // Agency Clearance</span>
        <h2 className="mt-4 font-mono text-2xl font-bold tracking-tight text-paper sm:text-3xl">
          The declassified case files
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-paper/60">
          The full episodes screen inside the Agency, where membership lives.
          Watching one is a click away. It just happens over there, not here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GATED_EPISODES.map((ep) => (
          <a
            key={ep.code}
            href={AGENCY_URL}
            className="dossier group relative flex items-center gap-5 overflow-hidden p-5 transition hover:border-acid/50"
          >
            {/* Silhouette poster — the rogue in shadow, never a player. */}
            <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ep.art}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-40 grayscale-[0.3] transition duration-500 group-hover:opacity-60"
              />
              {/* Acid-green corruption wash + navy vignette. */}
              <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_0%,rgba(124,252,77,0.12)_0%,rgba(4,16,28,0.85)_70%)]" />
              {/* Black redaction bar. */}
              <div className="absolute left-0 top-1/2 h-4 w-full -translate-y-1/2 bg-redact/85" />
              <span className="absolute bottom-1 left-1 bg-acid px-1 font-mono text-[0.55rem] font-bold uppercase tracking-widest text-ink">
                Classified
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase tracking-widest text-paper/40">
                {ep.code} · {ep.track}
              </p>
              <p className="mt-1 truncate text-lg font-bold text-paper">{ep.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-paper/55">{ep.teaser}</p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-amber">
                Watch in the Agency <ArrowUpRight size={14} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
