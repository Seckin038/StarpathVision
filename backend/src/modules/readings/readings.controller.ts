
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReadingsService } from './readings.service';
import { PdfService } from '../pdf/pdf.service';

@Controller('readings')
export class ReadingsController {
  constructor(
    private readonly svc: ReadingsService,
    private readonly pdfSvc: PdfService,
  ) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  async createFromVision(
    @Body() body: { cards: { name: string; orientation: string }[] },
  ) {
    return this.svc.createFromVision(body.cards);
  }

  @Post(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.pdfSvc.create(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reading-${id}.pdf`,
    });
    res.send(pdf);
  }
}

