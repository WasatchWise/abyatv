import { TRACKS, TRACK_ZERO, PRODUCTION_STATUS, type Track } from '@/lib/tracks';
import { Clapperboard, Lock } from 'lucide-react';

/**
 * The 10 Agent FERPA tracks + Track 0 ("start here"). Every tile is a
 * "trailer coming" placeholder today. The tile is built so a real trailer
 * video drops into `track.trailerUrl` later with no layout rework.
 */
function TrackTile({ track, starter }: { track: Track; starter?: boolean }) {
  const hasTrailer = Boolean(track.trailerUrl);
  return (
    <div
      className={`dossier group relative flex flex-col overflow-hidden p-5 transition hover:border-amber/50 ${
        starter ? 'ring-1 ring-amber/40' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-3xl font-bold text-ink-500 transition group-hover:text-amber/70">
          {String(track.no).padStart(2, '0')}
        </span>
        {starter ? (
          <span className="stamp text-[0.6rem]">Start here</span>
        ) : (
          <span className="label flex items-center gap-1 text-paper/40">
            <Clapperboard size={12} /> Trailer
          </span>
        )}
      </div>

      <h3 className="mt-3 font-mono text-base font-bold leading-snug text-paper">
        {track.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-paper/55">{track.blurb}</p>

      {/* Trailer slot: placeholder now, player when a URL lands. */}
      <div className="mt-4">
        {hasTrailer ? (
          <video controls playsInline preload="none" className="aspect-video w-full rounded bg-ink">
            <source src={track.trailerUrl as string} type="video/mp4" />
          </video>
        ) : (
          <div className="flex items-center gap-2 rounded border border-dashed border-ink-500 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-widest text-paper/40">
            <Lock size={12} /> Trailer coming
          </div>
        )}
      </div>
    </div>
  );
}

export function TrackTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="tracks">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label text-amber">The Case File Tracks</span>
          <h2 className="mt-2 font-mono text-2xl font-bold tracking-tight text-paper sm:text-3xl">
            Ten tracks. One on-ramp.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-paper/60">
            The Agent FERPA training tracks. Section trailers are in production.
            Each tile is ready for its video the day it lands.
          </p>
        </div>
        <span className="stamp text-[0.65rem]">{PRODUCTION_STATUS.label}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TrackTile track={TRACK_ZERO} starter />
        {TRACKS.map((t) => (
          <TrackTile key={t.code} track={t} />
        ))}
      </div>
    </section>
  );
}
