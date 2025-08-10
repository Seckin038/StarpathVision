import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { cfg } from '../../common/config';

@Injectable()
export class StorageService {
  private readonly client: MinioClient;

  constructor() {
    const url = new URL(cfg.s3.endpoint);
    const port = url.port ? parseInt(url.port, 10) : 9000;

    this.client = new MinioClient({
      endPoint: url.hostname,
      port,
      useSSL: url.protocol === 'https:',
      accessKey: cfg.s3.accessKey,
      secretKey: cfg.s3.secretKey,
    });
  }

  async presignPut(key: string, mime: string): Promise<string> {
    return (this.client as any).presignedPutObject(cfg.s3.bucket, key, 60 * 10, {
      'Content-Type': mime,
    });
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(cfg.s3.bucket, key);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
}

