import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { cfg } from '../../common/config';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: cfg.smtp.host,
    port: 587,
    secure: false,
    auth: { user: cfg.smtp.user, pass: cfg.smtp.pass },
  });

  /**
   * Send an email. Optionally provide a PDF buffer to attach or a link that
   * will be appended to the body.
   */
  async send(
    to: string,
    subject: string,
    body: string,
    opts?: { pdf?: Buffer; link?: string },
  ) {
    const mail = {
      from: cfg.smtp.user,
      to,
      subject,
      text: opts?.link ? `${body}\n${opts.link}` : body,
      attachments: opts?.pdf
        ? [{ filename: 'reading.pdf', content: opts.pdf }]
        : undefined,
    };

    await this.transporter.sendMail(mail);
    return { to, subject };
  }
}

