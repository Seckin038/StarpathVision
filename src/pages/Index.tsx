import { ThemeToggle } from "@/components/theme-toggle";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-8 bg-gray-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-gray-600">
          Start building your amazing project here!
        </p>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;
