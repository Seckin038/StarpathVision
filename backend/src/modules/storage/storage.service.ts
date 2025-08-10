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

  async get(key: string): Promise<Buffer> {
    const stream = await this.m.getObject(cfg.s3.bucket, key);
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (d) => chunks.push(Buffer.from(d)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }
}

