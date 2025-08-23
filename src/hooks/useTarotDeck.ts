import { useQuery } from "@tanstack/react-query";
import { Locale } from "@/types/tarot";

export type TarotDeckCard = { id: string; name: string; imageUrl?: string; meaning_up?: string | null };

const fetchTarotDeck = async (locale: Locale): Promise<TarotDeckCard[]> => {
  let targetLocale: Locale = locale;
  try {
    let response = await fetch(`/tarot/cards.${targetLocale}.json`);
    if (!response.ok) {
      console.warn(`Tarot deck for locale '${targetLocale}' not found, falling back to 'en'.`);
      targetLocale = 'en';
      response = await fetch(`/tarot/cards.en.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tarot deck for fallback 'en'`);
      }
    }
    
    const rawData: any[] = await response.json();

    // Process raw data which might have localized objects
    return rawData.map(card => ({
      id: card.id,
      name: (typeof card.name === 'object' && card.name !== null) 
        ? (card.name[targetLocale] ?? card.name['en'] ?? card.id) 
        : (card.name || card.id),
      imageUrl: card.image_url || card.imageUrl,
      meaning_up: (typeof card.meaning_up === 'object' && card.meaning_up !== null)
        ? (card.meaning_up[targetLocale] ?? card.meaning_up['en'] ?? null)
        : (card.meaning_up || null),
    }));

  } catch (error) {
    console.error("Error fetching tarot deck:", error);
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