import { Body, Controller, Post } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly svc: UploadsService) {}

  @Post('presign')
  async presign(
    @Body()
    dto: {
      kind: 'image' | 'audio' | 'pdf';
      mime: string;
      bytes: number;
      sessionId?: string;
      clientId?: string;
    },
  ) {
    return this.svc.presign(dto);
  }
}

