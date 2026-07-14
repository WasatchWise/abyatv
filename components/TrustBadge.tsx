import { ShieldOff } from 'lucide-react';

/**
 * The zero-PII trust hook, ON the page in ABYA's voice. For this audience the
 * privacy wall is not fine print, it is the reason they return. `compact` is
 * the sidebar/inline version; the default is the full band.
 */
export function TrustBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-md border border-signal/30 bg-signal/5 p-4">
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-signal">
          <ShieldOff size={14} /> We collect nothing
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/65">
          No account. No cookie. No tracker. We can’t sell your data because we
          never take it. That’s the whole point.
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grain relative overflow-hidden rounded-md border border-signal/30 bg-signal/[0.06] p-6 sm:p-8">
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-signal text-signal">
            <ShieldOff size={22} />
          </span>
          <div>
            <p className="text-lg font-bold leading-snug text-paper sm:text-xl">
              We collect nothing. No account. No cookie. No tracker.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-paper/65 sm:text-base">
              We can’t sell your data because we never take it. That’s the whole
              point. Bookmark any page and come back as often as you like. The
              link remembers, we don’t.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
