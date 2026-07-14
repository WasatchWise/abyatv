import Link from 'next/link';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL ?? 'https://askbeforeyouapp.com';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-500/50 bg-ink-800/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="font-mono text-lg font-bold tracking-[0.2em]">
              ABYA<span className="text-amber">.TV</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              The public reading room for Ask Before You App. Free and anonymous.
              We do not run accounts, logins, or trackers here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="label text-paper/40">Browse</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/directory" className="text-paper/70 hover:text-amber">
                    The Directory
                  </Link>
                </li>
                <li>
                  <Link href="/#tracks" className="text-paper/70 hover:text-amber">
                    Case File Tracks
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label text-paper/40">The Agency</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href={AGENCY_URL} className="text-paper/70 hover:text-amber">
                    Membership
                  </a>
                </li>
                <li>
                  <a href={`${AGENCY_URL}/pricing`} className="text-paper/70 hover:text-amber">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-ink-500/40 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            CLEARANCE: PUBLIC · NO ACCOUNT REQUIRED · NO TRACKERS
          </p>
          <p>© {new Date().getFullYear()} Ask Before You App · Wasatch Wise LLC</p>
        </div>
      </div>
    </footer>
  );
}
