import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Locale } from '@/types/tarot';

// --- Types ---
export interface InterpretationData {
  combinedInterpretation: {
    story: string;
    advice: string;
    affirmation: string;
  };
  cardInterpretations: {
    cardName: string;
    positionTitle: string;
    isReversed: boolean;
    shortMeaning: string;
    longMeaning: string;
    keywords: string[];
  }[];
}

interface TarotInterpretationPayload {
  locale: Locale;
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
      const { data: result, error: invokeError } = await supabase.functions.invoke('interpret-tarot', {
        body: payload,
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get interpretation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, getInterpretation };
}