import type { Metadata } from 'next';
import { fetchVideos, topCategories } from '@/lib/videos';
import { DirectoryClient } from '@/components/DirectoryClient';

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <span className="stamp">Ask Before You Play</span>
        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight text-paper sm:text-4xl">
          The Directory
        </h1>
        <p className="mt-3 max-w-2xl text-paper/60">
          {videos.length} vetted videos, each with a straight read on what is
          actually in it. Filter by age and category, or search the briefs. The
          links open on the original platform. We never host the video, and we
          never ask who you are.
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
    </div>
  );
}
