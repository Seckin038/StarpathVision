import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly svc: EmailService) {}

  @Post('send')
  async send(
    @Body()
    dto: {
      to: string;
      subject: string;
      body: string;
      link?: string;
      pdfBase64?: string;
    },
  ) {
    const pdf = dto.pdfBase64 ? Buffer.from(dto.pdfBase64, 'base64') : undefined;
    await this.svc.send(dto.to, dto.subject, dto.body, { link: dto.link, pdf });
    return { sent: true };
  }
}
