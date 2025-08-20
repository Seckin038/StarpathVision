import { MadeWithDyad } from "@/components/made-with-dyad";
import HomePersonaCTA from "@/components/HomePersonaCTA";

const Index = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <HomePersonaCTA />
      {/* You can add other homepage sections here later */}
      <footer className="text-center mt-12">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;