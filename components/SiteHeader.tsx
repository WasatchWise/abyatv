import Link from 'next/link';
import { FileSearch } from 'lucide-react';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL || 'https://askbeforeyouapp.com';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/50 bg-ink-800/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-amber text-amber">
            <FileSearch size={18} />
          </span>
          <span className="font-mono text-lg font-bold tracking-[0.2em] text-paper">
            ABYA<span className="text-amber">.TV</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/directory"
            className="rounded px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-paper/80 transition hover:text-amber"
          >
            The Directory
          </Link>
          <Link
            href="/#tracks"
            className="hidden rounded px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-paper/80 transition hover:text-amber sm:block"
          >
            Case Files
          </Link>
          <a
            href={AGENCY_URL}
            className="stamp transition hover:bg-amber hover:text-ink"
          >
            Enter the Agency
          </a>
        </nav>
      </div>
    </header>
  );
}
