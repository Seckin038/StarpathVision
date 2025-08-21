import { useQuery } from "@tanstack/react-query";
import { Locale } from "@/types/tarot";

export type TarotDeckCard = { id: string; name: string; imageUrl?: string; meaning_up?: string | null };

const fetchTarotDeck = async (locale: Locale): Promise<TarotDeckCard[]> => {
  try {
    const response = await fetch(`/tarot/cards.${locale}.json`);
    if (!response.ok) {
      // Fallback to English if the locale file doesn't exist
      const fallbackResponse = await fetch(`/tarot/cards.en.json`);
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch tarot deck for locale: ${locale} and fallback 'en'`);
      }
      const data = await fallbackResponse.json();
      return data;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tarot deck:", error);
    // As a last resort, return an empty array
    return [];
  }
};

export function useTarotDeck(locale: Locale) {
  const { data: deck = [], isLoading: loading, error } = useQuery({
    queryKey: ['tarotDeckJson', locale], // Use locale in key to refetch on lang change
    queryFn: () => fetchTarotDeck(locale),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  return { deck, loading, error };
}