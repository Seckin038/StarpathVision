// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithDyad } from "@/components/made-with-dyad";
import { usePersonae } from "@/hooks/use-personae";

const Index = () => {
  const { data: personae, error, loading } = usePersonae();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-gray-600">
          Start building your amazing project here!
        </p>
        <div className="mt-4">
          {loading && <p>Loading personae...</p>}
          {error && (
            <p className="text-red-500">Failed to load personae: {error}</p>
          )}
          {!loading && !error && (
            <ul className="list-disc list-inside text-left">
              {personae.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;
