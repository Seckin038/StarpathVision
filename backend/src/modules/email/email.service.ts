import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  // Placeholder for future implementation
  async send(to: string, subject: string, body: string) {
    // TODO: implement with nodemailer
    return { to, subject };
  }
}

