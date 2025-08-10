import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { query } from 'common/db';

@Injectable()
export class ClientsService {
  async create(dto: { first_name: string; last_name: string }) {
    const id = randomUUID();
    const { rows } = await query(
      'INSERT INTO clients (id, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
      [id, dto.first_name, dto.last_name],
    );
    return rows[0];
  }

  async get(id: string) {
    const { rows } = await query('SELECT * FROM clients WHERE id = $1', [id]);
    return rows[0] ?? null;
  }
}

