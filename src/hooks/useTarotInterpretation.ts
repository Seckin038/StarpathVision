import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Locale } from '@/types/tarot';

// --- Types ---
export interface CardInterpretation {
  card_index: number;
  interpretation: string;
}

export interface InterpretationData {
  story: string;
  advice: string;
  affirmation: string;
  actions: string[];
  card_interpretations: CardInterpretation[];
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

      setData(result.reading);

    } catch (err: any) {
      setError(err.message || 'Failed to get interpretation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetInterpretation = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, getInterpretation, resetInterpretation };
}