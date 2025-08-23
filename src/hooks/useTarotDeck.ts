import { useQuery } from "@tanstack/react-query";
import { Locale } from "@/types/tarot";
import { supabase } from "@/lib/supabaseClient";

export type TarotDeckCard = { 
  id: string; 
  name: string; 
  imageUrl?: string; 
  meaning_up?: string | null;
  meaning_rev?: string | null;
  keywords?: string[] | null;
  element?: string | null;
  astrology?: string | null;
};

const fetchTarotDeck = async (locale: Locale): Promise<TarotDeckCard[]> => {
  try {
    const { data, error } = await supabase
      .from("tarot_cards")
      .select("id, name, image_url, meaning_up, meaning_rev, number, keywords, element, astrology")
      .order("number");

    if (error) {
      throw error;
    }

    return data.map(card => ({
      id: card.id,
      name: card.name?.[locale] ?? card.name?.['en'] ?? card.id,
      imageUrl: card.image_url,
      meaning_up: card.meaning_up?.[locale] ?? card.meaning_up?.['en'] ?? null,
      meaning_rev: card.meaning_rev?.[locale] ?? card.meaning_rev?.['en'] ?? null,
      keywords: card.keywords,
      element: card.element,
      astrology: card.astrology,
    }));

  } catch (error) {
    console.error("Error fetching tarot deck from Supabase:", error);
    // Fallback to local JSON if Supabase fails
    try {
      const response = await fetch(`/tarot/cards.en.json`);
      const rawData: any[] = await response.json();
      return rawData.map(card => ({
        id: card.id,
        name: (typeof card.name === 'object' && card.name !== null) 
          ? (card.name[locale] ?? card.name['en'] ?? card.id) 
          : (card.name || card.id),
        imageUrl: card.image_url || card.imageUrl,
        meaning_up: (typeof card.meaning_up === 'object' && card.meaning_up !== null)
          ? (card.meaning_up[locale] ?? card.meaning_up['en'] ?? null)
          : (card.meaning_up || null),
        meaning_rev: (typeof card.meaning_rev === 'object' && card.meaning_rev !== null)
          ? (card.meaning_rev[locale] ?? card.meaning_rev['en'] ?? null)
          : (card.meaning_rev || null),
        keywords: card.keywords,
        element: card.element,
        astrology: card.astrology,
      }));
    } catch (fallbackError) {
      console.error("Fallback to local JSON also failed:", fallbackError);
      return [];
    }
  }
};

export function useTarotDeck(locale: Locale) {
  const { data: deck = [], isLoading: loading, error } = useQuery({
    queryKey: ['tarotDeck', locale], // Use locale in key to refetch on lang change
    queryFn: () => fetchTarotDeck(locale),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return { deck, loading, error };
}