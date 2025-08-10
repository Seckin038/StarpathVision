import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { cfg } from '../../common/config';

interface Session {
  id: string;
  client_id: string;
  created_at: Date;
}

@Injectable()
export class SessionsService {
  private db: Pool;

  constructor() {
    this.db = new Pool({ connectionString: cfg.db.url });
  }

  async create(dto: { client_id: string }): Promise<Session> {
    // Ensure the client exists to satisfy FK constraints
    const client = await this.db.query('SELECT id FROM clients WHERE id = $1', [
      dto.client_id,
    ]);
    if (client.rowCount === 0) {
      throw new NotFoundException('Client not found');
    }

    const id = randomUUID();
    const { rows } = await this.db.query(
      'INSERT INTO sessions (id, client_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [id, dto.client_id],
    );
    return rows[0];
  }

  async get(id: string): Promise<Session | undefined> {
    const { rows } = await this.db.query(
      'SELECT id, client_id, created_at FROM sessions WHERE id = $1',
      [id],
    );
    return rows[0];
  }

  async list(clientId: string): Promise<Session[]> {
    const { rows } = await this.db.query(
      'SELECT id, client_id, created_at FROM sessions WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId],
    );
    return rows;
  }
}

