import { MadeWithDyad } from "@/components/made-with-dyad";
import { ThemeToggle } from "@/components/theme-toggle";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">
          Start building your amazing project here!
        </p>
        <ThemeToggle />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;
