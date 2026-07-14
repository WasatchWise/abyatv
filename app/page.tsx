import { HubHero } from '@/components/HubHero';
import { FourDoors } from '@/components/FourDoors';
import { TrackTiles } from '@/components/TrackTiles';
import { GatedEpisodes } from '@/components/GatedEpisodes';
import { BriefingCTA } from '@/components/BriefingCTA';
import { TrustBadge } from '@/components/TrustBadge';

export default function HomePage() {
  return (
    <>
      <HubHero />
      <div className="py-8">
        <TrustBadge />
      </div>
      <FourDoors />
      <TrackTiles />
      <GatedEpisodes />
      <BriefingCTA />
    </>
  );
}
