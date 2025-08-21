import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type TarotDeckCard = { id: string; name: string; imageUrl?: string };

const fetchTarotDeck = async (locale: "nl" | "en" | "tr"): Promise<TarotDeckCard[]> => {
  // Probeer DB eerst
  const { data, error } = await supabase
    .from("tarot_cards")
    .select("id, image_url, name_nl, name_en, name_tr")
    .order("id"); // Zorg voor een consistente volgorde

  if (!error && data && data.length > 0) {
    return data.map((r: any) => ({
      id: r.id,
      name: r[`name_${locale}`] || r.name_en || r.id,
      imageUrl: r.image_url,
    }));
  }

  // Fallback: oude JSON
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