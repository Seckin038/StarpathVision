import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface DetectedCard {
  name: string;
  orientation: 'upright' | 'reversed';
  confidence: number;
}

export interface InterpretationRequest {
  deck: string;
  cards: DetectedCard[];
}

export interface InterpretationResult {
  id: string;
  summary: string;
  full_text: string;
  model: string;
}

@Injectable()
export class ReadingsService {
  async get(id: string) {
    // TODO: fetch from DB
    return { id, summary: 'Demo reading', full_text: 'Volledige tekst (demo)' };
  }

  async interpret(dto: InterpretationRequest): Promise<InterpretationResult> {
    // Placeholder interpretation logic
    const summary = `Interpretation for ${dto.cards
      .map((c) => c.name)
      .join(', ')} in deck ${dto.deck}`;
    return {
      id: randomUUID(),
      summary,
      full_text: summary + '. (demo)',
      model: 'rule-based-demo',
    };
  }
}

