import { Body, Controller, Post } from '@nestjs/common';
import { VisionService } from './vision.service';

@Controller('vision')
export class VisionController {
  constructor(private readonly svc: VisionService) {}

  @Post('tarot/recognize')
  async recognizeTarot(@Body() dto: { uploadId: string; deckHint?: string }) {
    return this.svc.recognizeTarot(dto);
  }
}

