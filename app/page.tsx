import { HubHero } from '@/components/HubHero';
import { FourDoors } from '@/components/FourDoors';
import { TrackTiles } from '@/components/TrackTiles';
import { GatedEpisodes } from '@/components/GatedEpisodes';
import { BriefingCTA } from '@/components/BriefingCTA';

export default function HomePage() {
  return (
    <>
      <HubHero />
      <FourDoors />
      <TrackTiles />
      <GatedEpisodes />
      <BriefingCTA />
    </>
  );
}
