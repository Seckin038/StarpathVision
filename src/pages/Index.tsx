import { MadeWithDyad } from "@/components/made-with-dyad";
import HomeHero from "@/components/HomeHero";
import HomeFeatures from "@/components/HomeFeatures";

const Index = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <HomeHero />
      <HomeFeatures />
      <footer className="text-center mt-12 pb-8">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;