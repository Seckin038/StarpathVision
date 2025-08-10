import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { query } from 'common/db';

interface Session {
  id: string;
  client_id: string;
  created_at: Date;
}

@Injectable()
export class SessionsService {

  async create(dto: { client_id: string }): Promise<Session> {
    // Ensure the client exists to satisfy FK constraints
    const client = await query<{ id: string }>('SELECT id FROM clients WHERE id = $1', [
      dto.client_id,
    ]);
    if (client.rowCount === 0) {
      throw new NotFoundException('Client not found');
    }

    const id = randomUUID();
    const { rows } = await query<Session>(
      'INSERT INTO sessions (id, client_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [id, dto.client_id],
    );
    return rows[0];
  }

  async get(id: string): Promise<Session | undefined> {
    const { rows } = await query<Session>(
      'SELECT id, client_id, created_at FROM sessions WHERE id = $1',
      [id],
    );
    return rows[0];
  }

  /**
   * Return all sessions belonging to a specific client ordered by creation date
   * (most recent first).
   */
  async listByClient(clientId: string): Promise<Session[]> {
    const { rows } = await query<Session>(
      'SELECT id, client_id, created_at FROM sessions WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId],
    );
    return rows;
  }
}

