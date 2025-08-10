import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';
import {
  ReadingsService,
  DetectedCard,
} from '../readings/readings.service';

@Injectable()
export class VisionService {
  constructor(
    private readonly storage: StorageService,
    private readonly readings: ReadingsService,
  ) {}

  private labelMap: Record<string, string> = {
    'The Sun': 'De Zon',
    'The Moon': 'De Maan',
    'The Magician': 'De Magi\u00ebr',
  };

  private async detectCards(buf: Buffer): Promise<{ label: string; score: number }[]> {
    const stats = await sharp(buf).stats();
    const brightness =
      (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) /
      3;
    let label = 'The Magician';
    if (brightness > 180) label = 'The Sun';
    else if (brightness < 75) label = 'The Moon';
    return [{ label, score: 0.6 + Math.abs(brightness - 128) / 512 }];
  }

  private async detectOrientation(buf: Buffer): Promise<'upright' | 'reversed'> {
    const meta = await sharp(buf).metadata();
    if (meta.orientation && [3, 4].includes(meta.orientation)) {
      return 'reversed';
    }
    return 'upright';
  }

  async recognizeTarot(dto: { uploadId: string; deckHint?: string }) {
    const img = await this.storage.getObjectBuffer(dto.uploadId);
    const deck = dto.deckHint || 'rider-waite';
    const modelPredictions = await this.detectCards(img);
    const orientation = await this.detectOrientation(img);
    const cards: DetectedCard[] = modelPredictions.map((p) => ({
      name: this.labelMap[p.label] || p.label,
      orientation,
      confidence: p.score,
    }));
    const reading = await this.readings.interpret({ deck, cards });
    return {
      deck,
      cards,
      readingId: reading.id,
      explanation: {
        summary: reading.summary,
        full: reading.full_text,
        model: reading.model,
      },
    };
  }
}

