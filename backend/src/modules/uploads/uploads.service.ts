import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';
import { query } from 'common/db';

@Injectable()
export class UploadsService {
  constructor(private storage: StorageService) {}

  async presign(dto: {
    kind: 'image' | 'audio' | 'pdf';
    mime: string;
    bytes: number;
    sessionId?: string;
    clientId?: string;
  }) {
    const key = `uploads/${dto.clientId ?? 'anon'}/${randomUUID()}`;
    const uploadUrl = await this.storage.presignedPutObject(key, dto.mime);
    const result = await query<{ id: string }>(
      `INSERT INTO uploads (storage_key, mime, bytes, session_id, client_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [key, dto.mime, dto.bytes, dto.sessionId ?? null, dto.clientId ?? null],
    );
    return { uploadId: result.rows[0].id, uploadUrl, key };
  }
}

