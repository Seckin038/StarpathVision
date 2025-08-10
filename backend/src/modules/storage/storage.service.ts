import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { cfg } from '../../common/config';

@Injectable()
export class StorageService {
  private m: MinioClient;
  constructor() {
    this.m = new MinioClient({
      endPoint: new URL(cfg.s3.endpoint).hostname,
      port: Number(new URL(cfg.s3.endpoint).port || 9000),
      useSSL: cfg.s3.endpoint.startsWith('https'),
      accessKey: cfg.s3.accessKey,
      secretKey: cfg.s3.secretKey,
    });
  }

  async presignPut(key: string, mime: string): Promise<string> {
    return await this.m.presignedPutObject(cfg.s3.bucket, key, 60 * 10, {
      'Content-Type': mime,
    });
  }
}

