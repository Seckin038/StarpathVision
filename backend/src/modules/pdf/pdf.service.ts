import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { ReadingsService } from '../readings/readings.service';

// 1x1 transparent PNG used as a fallback logo/card image
const PLACEHOLDER_IMG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/woAAn8B9W410wAAAABJRU5ErkJggg==',
  'base64',
);

@Injectable()
export class PdfService {
  constructor(private readonly readingsSvc: ReadingsService) {}

  /**
   * Compose an A4 PDF for the given reading containing a logo, the reading
   * text and thumbnails of the cards used in the reading. Returns the PDF as a
   * Buffer.
   */
  async create(readingId: string): Promise<Buffer> {
    const reading = await this.readingsSvc.get(readingId);

    const pdfDoc = await PDFDocument.create();
    // Dimensions for an A4 page in PDF points
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();

    // Draw logo at the top left
    try {
      const logoImg = await pdfDoc.embedPng(PLACEHOLDER_IMG);
      page.drawImage(logoImg, { x: 40, y: height - 90, width: 100, height: 50 });
    } catch {
      // ignore logo failures
    }

    // Compose reading text
    const text = `${reading.summary}\n\n${reading.full_text ?? ''}`;
    const lines = text.split(/\n/);
    let y = height - 130;
    for (const line of lines) {
      page.drawText(line, { x: 40, y, size: 12, font });
      y -= 14;
    }

    // Card thumbnails (if available)
    const cards: any[] = (reading as any).cards || [];
    if (cards.length) {
      y -= 170; // leave some space after text
      let x = 40;
      for (const c of cards) {
        try {
          const imgBytes = c.thumbnail || PLACEHOLDER_IMG;
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { x, y, width: 100, height: 150 });
        } catch {
          // ignore image failures
        }
        x += 110;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

