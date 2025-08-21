import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Locale } from '@/types/tarot';
import { getCachedPersonas } from '@/lib/persona-registry';

// --- Types ---
export interface InterpretationData {
  // This structure might change based on the new generic function's output
  text: string; 
}

export interface TarotInterpretationPayload {
  locale: Locale;
  personaId: string;
  spread: { id: string; name: string };
  spreadGuide: string;
  cards: {
    index: number;
    name: string;
    upright: boolean;
    position_key: string;
    position_title: string;
  }[];
}

// --- Hook ---
export function useTarotInterpretation() {
  const [data, setData] = useState<InterpretationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInterpretation = useCallback(async (payload: TarotInterpretationPayload) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: invokeError } = await supabase.functions.invoke('generate-reading', {
        body: {
          locale: payload.locale,
          personaId: payload.personaId,
          method: 'tarot',
          payload: {
            spread: payload.spread,
            cards: payload.cards,
            spreadGuide: payload.spreadGuide,
          }
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      // The new function returns a simple object with a 'reading' text property.
      // We need to adapt this to the structure TarotInterpretationPanel expects.
      // For now, let's just pass the text. A more complex mapping might be needed.
      setData({ text: result.reading });

    } catch (err: any) {
      setError(err.message || 'Failed to get interpretation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, getInterpretation };
}