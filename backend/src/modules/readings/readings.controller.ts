import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ReadingsService } from './readings.service';
import { PdfService } from '../pdf/pdf.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner', 'assistant')
@Controller('readings')
export class ReadingsController {
  constructor(
    private readonly svc: ReadingsService,
    private readonly pdfSvc: PdfService,
  ) {}

  @Get(':id')
  @Roles('assistant')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  @Roles('owner', 'assistant')
  async createFromVision(
    @Body() body: { cards: { name: string; orientation: string }[] },
  ) {
    return this.svc.createFromVision(body.cards);
  }

  @Post(':id/pdf')
  @Roles('owner', 'assistant')
  async createPdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.pdfSvc.create(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reading-${id}.pdf`,
    );
    res.send(pdf);
  }
}

