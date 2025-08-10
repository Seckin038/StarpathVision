import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { cfg } from '../../common/config';
import { Role } from '../../common/roles.decorator';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

@Injectable()
export class AuthService {
  private readonly secret = cfg.auth.jwtSecret;

  issue(role: Role) {
    if (!['owner', 'assistant'].includes(role)) {
      throw new Error('unsupported role');
    }
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url(
      JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 60 * 60 })
    );
    const data = `${header}.${payload}`;
    const signature = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
    return `${data}.${signature}`;
  }

  verify(token: string): { role: Role } {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) {
      throw new Error('invalid token');
    }

    let header: { alg: string };
    let payload: { role?: Role; exp?: number };
    try {
      header = JSON.parse(Buffer.from(h, 'base64url').toString());
      payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    } catch {
      throw new Error('invalid token');
    }

    if (header.alg !== 'HS256') {
      throw new Error('unsupported algorithm');
    }

    const data = `${h}.${p}`;
    const expected = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
    if (s !== expected) {
      throw new Error('invalid signature');
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('token expired');
    }

    if (!payload.role) {
      throw new Error('invalid token');
    }

    return { role: payload.role };
  }
}
