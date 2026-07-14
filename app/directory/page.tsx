import type { Metadata } from 'next';
import { fetchVideos, topCategories } from '@/lib/videos';
import { DirectoryClient } from '@/components/DirectoryClient';
import { TrustBadge } from '@/components/TrustBadge';

export const metadata: Metadata = {
  title: 'The Directory',
  description:
    'A vetted, searchable directory of educational videos, each with a plain-language brief on what is in it before you press play. Free and anonymous.',
};

// Revalidate the vetted set periodically. No per-request personalization,
// no cookies — this page is fully cacheable and identical for everyone.
export const revalidate = 3600;

export default async function DirectoryPage() {
  const videos = await fetchVideos();
  const categories = topCategories(videos);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="stamp">Ask Before You Play</span>
            <h1 className="mt-3 font-mono text-2xl font-bold tracking-tight text-paper sm:text-3xl">
              Is this video okay?
            </h1>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-paper/45">
            {videos.length} vetted reviews
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-paper/60">
          Paste the link you were handed, or search the title. You get the brief,
          the age band, and the score in seconds. Bookmark anything and come back
          any time. No account, ever.
        </p>
      </header>

      {videos.length === 0 ? (
        <div className="dossier p-12 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-paper/50">
            The directory is temporarily unavailable.
          </p>
          <p className="mt-2 text-sm text-paper/40">
            The vetted set could not be loaded. Please check back shortly.
          </p>
        </div>
      ) : (
        <DirectoryClient videos={videos} categories={categories} />
      )}

      <div className="mt-16">
        <TrustBadge />
      </div>
    </div>
  );
}
