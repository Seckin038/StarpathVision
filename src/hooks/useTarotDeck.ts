import { useQuery } from "@tanstack/react-query";

export type TarotDeckCard = { id: string; name: string; imageUrl?: string };

const fetchTarotDeck = async (locale: "nl" | "en" | "tr"): Promise<TarotDeckCard[]> => {
  // Laad de kaarten altijd uit de lokale JSON-bestanden,
  // omdat deze de volledige set van 78 kaarten bevatten.
  const res = await fetch(`/tarot/cards.${locale}.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tarot deck from JSON for locale: ${locale}`);
  }
  const json = await res.json();
  return json.map((c: any) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image ? `/tarot/${c.image}` : undefined,
  }));
};

export function useTarotDeck(locale: "nl" | "en" | "tr") {
  const { data: deck = [], isLoading: loading, error } = useQuery({
    queryKey: ['tarotDeck', locale],
    queryFn: () => fetchTarotDeck(locale),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  return { deck, loading, error };
}