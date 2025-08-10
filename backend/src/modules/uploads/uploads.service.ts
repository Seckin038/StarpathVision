import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';

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
    const url = await this.storage.presignPut(key, dto.mime);
    // TODO: insert uploads row in DB
    return { uploadId: randomUUID(), url, key };
  }
}

