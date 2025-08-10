import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { query } from '../../common/db';

interface Session {
  id: string;
  clientId: string;
  createdAt: Date;
}

@Injectable()
export class SessionsService {
  async create(dto: { clientId: string }): Promise<Session> {
    const client = await query('SELECT id FROM clients WHERE id = $1', [
      dto.clientId,
    ]);

    if (client.rowCount === 0) {
      throw new NotFoundException('Client not found');
    }

    const id = randomUUID();
    const { rows } = await query<Session>(
      'INSERT INTO sessions (id, "clientId", created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [id, dto.clientId],
    );

    return rows[0];
  }

  async get(id: string): Promise<Session | undefined> {
    const { rows } = await query<Session>(
      'SELECT id, "clientId", created_at FROM sessions WHERE id = $1',
      [id],
    );

    return rows[0];
  }

  async listByClientId(clientId: string): Promise<Session[]> {
    const { rows } = await query<Session>(
      'SELECT id, "clientId", created_at FROM sessions WHERE "clientId" = $1 ORDER BY created_at DESC',
      [clientId],
    );

    return rows;
  }
}