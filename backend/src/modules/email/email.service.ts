import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { cfg } from '../../common/config';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
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
    const text = opts?.link ? `${body}\n${opts.link}` : body;
    const html = opts?.link
      ? `${body.replace(/\n/g, '<br>')}<br><a href="${opts.link}">${opts.link}</a>`
      : body.replace(/\n/g, '<br>');

    await this.transporter.sendMail({
      from: cfg.smtp.user,
      to,
      subject,
      text,
      html,
      attachments: opts?.pdf
        ? [{ filename: 'reading.pdf', content: opts.pdf }]
        : undefined,
    });
    return { to, subject };
  }
}

