import { Mail, ArrowUpRight } from 'lucide-react';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL ?? 'https://askbeforeyouapp.com';

/**
 * The weekly briefing.
 *
 * ZERO-PII CHOICE (Phase 0): this is a LINK OUT, not a capture field. Email
 * subscription is identity, and identity lives on the Agency, never on
 * abya.tv. We do not render an input, we do not touch localStorage, and we do
 * not POST an address from here. The subscribe form is on askbeforeyouapp.com,
 * where the prod `newsletter_subscribers` table lives. A cross-origin POST
 * could be wired in a later phase once CORS is confirmed on that endpoint;
 * until then, link-out keeps the no-PII contract absolute.
 */
export function BriefingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="dossier grain relative overflow-hidden p-8 sm:p-12">
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="stamp">The Weekly Briefing</span>
            <h2 className="mt-4 font-mono text-2xl font-bold tracking-tight text-paper">
              One dispatch a week. What changed, what to watch.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              The briefing sign-up lives on the Agency, where your address is
              handled properly. We keep abya.tv account-free on purpose, so we
              send you there rather than collect anything here.
            </p>
          </div>
          <a
            href={`${AGENCY_URL}/#newsletter`}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-amber px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-ink transition hover:bg-amber-bright"
          >
            <Mail size={16} /> Get the briefing <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
