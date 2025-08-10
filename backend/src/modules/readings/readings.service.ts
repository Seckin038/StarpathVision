import { Injectable } from '@nestjs/common';

@Injectable()
export class ReadingsService {
  async get(id: string) {
    // TODO: fetch from DB
    return { id, summary: 'Demo reading', full_text: 'Volledige tekst (demo)' };
  }

  async createFromVision(cards: { name: string; orientation: string }[]) {
    // TODO: create reading from vision result
    return { id: 'demo', cards };
  }
}

