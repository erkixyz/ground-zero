import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly publicClient: S3Client;
  private readonly bucket: string;

  constructor() {
    const credentials = {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    };
    this.client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT!,
      region: "us-east-1",
      credentials,
      forcePathStyle: true,
    });
    // Presigned URLs must use the browser-reachable endpoint, not the internal Docker hostname.
    this.publicClient = new S3Client({
      endpoint: process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT!,
      region: "us-east-1",
      credentials,
      forcePathStyle: true,
    });
    this.bucket = process.env.MINIO_BUCKET ?? "ground-zero";
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async presignedGet(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.publicClient,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
