import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner', 'assistant')
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

