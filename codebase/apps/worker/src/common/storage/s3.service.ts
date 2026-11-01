import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { S3StorageRef } from '@videoforge/shared-types';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION', 'us-east-1');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', 'videoforge-assets');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', 'test'),
      },
      endpoint: this.config.get<string>('AWS_ENDPOINT_URL'),
      forcePathStyle: !!this.config.get<string>('AWS_ENDPOINT_URL'), // useful for localstack / minio
    });
  }

  /**
   * Downloads a generated clip from a remote provider temporary URL and persists it directly to S3.
   */
  async downloadAndUpload(
    sourceUrl: string,
    s3Key: string,
    contentType = 'video/mp4',
  ): Promise<{ storage: S3StorageRef; sizeBytes: number; publicUrl: string }> {
    this.logger.log(`Downloading asset from provider: ${sourceUrl.slice(0, 80)}...`);

    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`Failed to download video from provider: HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    this.logger.log(`Uploading ${buffer.length} bytes to S3: s3://${this.bucket}/${s3Key}`);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;

    return {
      storage: {
        provider: 's3',
        bucket: this.bucket,
        key: s3Key,
        region: this.region,
        publicUrl,
      },
      sizeBytes: buffer.length,
      publicUrl,
    };
  }
}
