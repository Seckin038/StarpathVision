import { Injectable } from '@nestjs/common';

@Injectable()
export class VisionService {
  async recognizeTarot(dto: { uploadId: string; deckHint?: string }) {
    // Stub response to unblock frontend
    return {
      readingId: 'demo-reading-id',
      cards: [
        { name: 'Kelken 3', orientation: 'upright', confidence: 0.92 },
        { name: 'Zwaarden 9', orientation: 'upright', confidence: 0.71 },
      ],
      explanation: {
        summary: 'Viering na zorgen; verlichting van stress.',
        full: 'Uitleg (demo) met voorbeelden en vervolgstappen.',
        model: 'demo-model',
      },
    };
  }
}

