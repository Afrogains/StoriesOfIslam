import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env';

export interface StoredObject {
  bucket: string;
  objectKey: string;
  sizeBytes: number;
  checksumSha256: string;
  publicUrl: string | null;
}

export class ObjectStorageService {
  private readonly env = getEnv();
  private readonly client = new S3Client({
    endpoint: this.env.S3_ENDPOINT,
    region: this.env.S3_REGION,
    forcePathStyle: this.env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: this.env.S3_ACCESS_KEY,
      secretAccessKey: this.env.S3_SECRET_KEY,
    },
  });

  async check(): Promise<void> {
    await Promise.all([
      this.client.send(new HeadBucketCommand({ Bucket: this.env.S3_PUBLIC_BUCKET })),
      this.client.send(new HeadBucketCommand({ Bucket: this.env.S3_PRIVATE_BUCKET })),
    ]);
  }

  async uploadBuffer(input: {
    objectKey: string;
    body: Buffer;
    mimeType: string;
    public: boolean;
    metadata?: Record<string, string>;
  }): Promise<StoredObject> {
    if (input.body.length === 0) throw new Error('Refusing to upload an empty object');
    const bucket = input.public ? this.env.S3_PUBLIC_BUCKET : this.env.S3_PRIVATE_BUCKET;
    const checksumSha256 = createHash('sha256').update(input.body).digest('hex');
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.mimeType,
        CacheControl: input.public ? 'public,max-age=31536000,immutable' : 'private,no-store',
        Metadata: { ...input.metadata, checksumSha256 },
      }),
    );
    return {
      bucket,
      objectKey: input.objectKey,
      sizeBytes: input.body.length,
      checksumSha256,
      publicUrl: input.public
        ? `${this.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${encodeObjectKey(input.objectKey)}`
        : null,
    };
  }

  async uploadFile(input: {
    filePath: string;
    objectKey: string;
    mimeType: string;
    public: boolean;
    metadata?: Record<string, string>;
  }): Promise<StoredObject> {
    const body = await readFile(input.filePath);
    return this.uploadBuffer({ ...input, body });
  }

  async signedDownloadUrl(objectKey: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.env.S3_PRIVATE_BUCKET, Key: objectKey }),
      { expiresIn: Math.min(900, Math.max(30, expiresInSeconds)) },
    );
  }

  async promoteToPublic(privateObjectKey: string, publicObjectKey: string): Promise<StoredObject> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.env.S3_PUBLIC_BUCKET,
        Key: publicObjectKey,
        CopySource: `${this.env.S3_PRIVATE_BUCKET}/${encodeObjectKey(privateObjectKey)}`,
        CacheControl: 'public,max-age=31536000,immutable',
        MetadataDirective: 'COPY',
      }),
    );
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.env.S3_PUBLIC_BUCKET, Key: publicObjectKey }),
    );
    const body = Buffer.from(await response.Body!.transformToByteArray());
    return {
      bucket: this.env.S3_PUBLIC_BUCKET,
      objectKey: publicObjectKey,
      sizeBytes: body.length,
      checksumSha256: createHash('sha256').update(body).digest('hex'),
      publicUrl: `${this.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${encodeObjectKey(publicObjectKey)}`,
    };
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  }
}

function encodeObjectKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

export const objectStorageService = new ObjectStorageService();
