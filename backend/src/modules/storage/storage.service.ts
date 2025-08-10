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

  async presignedPutObject(key: string, mime: string): Promise<string> {
    return this.client.presignedPutObject(cfg.s3.bucket, key, 60 * 10, {
      'Content-Type': mime,
    });
  }

  async getObjectBuffer(
    key: string,
    { maxSize, timeoutMs }: { maxSize?: number; timeoutMs?: number } = {},
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;
      let timer: NodeJS.Timeout | undefined;

      try {
        this.client.getObject(cfg.s3.bucket, key, (err, stream) => {
          if (err) {
            return reject(err);
          }

          if (timeoutMs) {
            timer = setTimeout(() => {
              stream.destroy(new Error('Stream timeout'));
              reject(new Error('Stream timeout'));
            }, timeoutMs);
          }

          stream.on('data', (chunk: Buffer | Uint8Array | string) => {
            const bufferChunk = Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk);
            totalSize += bufferChunk.length;
            if (maxSize && totalSize > maxSize) {
              stream.destroy(new Error('Max size exceeded'));
              if (timer) clearTimeout(timer);
              return reject(new Error('Max size exceeded'));
            }
            chunks.push(bufferChunk);
          });

          stream.on('end', () => {
            if (timer) clearTimeout(timer);
            resolve(Buffer.concat(chunks));
          });

          stream.on('error', (error) => {
            if (timer) clearTimeout(timer);
            reject(error);
          });
        });
      } catch (error) {
        if (timer) clearTimeout(timer);
        reject(error);
      }
    });
  }
}

