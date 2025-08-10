import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';
import { Pool } from 'pg';
import { cfg } from '../../common/config';

@Injectable()
export class UploadsService {
  private db: Pool;
  constructor(private storage: StorageService) {
    this.db = new Pool({ connectionString: cfg.db.url });
  }

  async presign(dto: {
    kind: 'image' | 'audio' | 'pdf';
    mime: string;
    bytes: number;
    sessionId?: string;
    clientId?: string;
  }) {
    const key = `uploads/${dto.clientId ?? 'anon'}/${randomUUID()}`;
    const url = await this.storage.presignPut(key, dto.mime);
    const result = await this.db.query(
      `INSERT INTO uploads (storage_key, mime, bytes, session_id, client_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [key, dto.mime, dto.bytes, dto.sessionId ?? null, dto.clientId ?? null],
    );
    return { uploadId: result.rows[0].id, url, key };
  }
}

