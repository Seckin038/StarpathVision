import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
  // Placeholder for future implementation
  async create(readingId: string) {
    // TODO: generate PDF using pdf-lib
    return { readingId };
  }
}

