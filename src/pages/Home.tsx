import BrandRibbon from "../components/BrandRibbon";
import HeroSection from "../components/HeroSection";
import CornerTiles from "../components/CornerTiles";
import SectionGlow from "../components/SectionGlow";
import Favorites from "../components/Favorites";
import HelpCTA from "../components/HelpCTA";

export default function Home() {
  return (
    <div className="home-page">
      <HeroSection />
      <SectionGlow />
      <CornerTiles />
      <BrandRibbon />

      <Favorites />

      <HelpCTA />

    </div>
  );
}
