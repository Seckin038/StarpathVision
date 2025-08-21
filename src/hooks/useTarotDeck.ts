import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Locale } from "@/types/tarot";

export type TarotDeckCard = { id: string; name: string; imageUrl?: string; meaning_up?: string | null };

const fetchTarotDeck = async (locale: Locale): Promise<TarotDeckCard[]> => {
  // TODO: In the future, support localized names from the database.
  // For now, we fetch the primary card data.
  const { data, error } = await supabase
    .from("tarot_cards")
    .select("id, name, image_url, meaning_up")
    .order("number", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tarot deck from Supabase: ${error.message}`);
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name, // This will need localization in the future
    imageUrl: c.image_url,
    meaning_up: c.meaning_up,
  }));
};

export function useTarotDeck(locale: Locale) {
  const { data: deck = [], isLoading: loading, error } = useQuery({
    queryKey: ['tarotDeckSupabase', locale], // Use locale in key to refetch on lang change
    queryFn: () => fetchTarotDeck(locale),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  return { deck, loading, error };
}