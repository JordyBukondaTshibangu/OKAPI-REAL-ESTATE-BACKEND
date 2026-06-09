import { Injectable } from "@nestjs/common";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PresignFileDto } from "./dto/presign-upload.dto";

export function toR2Url(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

const PRESIGN_TTL_SECONDS = 5 * 60;

@Injectable()
export class UploadsService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME ?? "";
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async createPresignedUploads(files: PresignFileDto[]) {
    return Promise.all(
      files.map(async (file) => {
        const extension = file.filename.split(".").pop()?.toLowerCase();
        const key = `tmp/${randomUUID()}${extension ? `.${extension}` : ""}`;

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: file.contentType,
        });

        const url = await getSignedUrl(this.client, command, {
          expiresIn: PRESIGN_TTL_SECONDS,
        });

        return { key, url };
      }),
    );
  }

  /** Copies one tmp/ object to a permanent key under the given prefix and deletes the original. */
  async promoteToPrefix(tmpKey: string, prefix: string): Promise<string> {
    const filename = tmpKey.split("/").pop();
    const newKey = `${prefix}/${filename}`;

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${tmpKey}`,
        Key: newKey,
      }),
    );

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: [{ Key: tmpKey }] },
      }),
    );

    return newKey;
  }

  /** Deletes a single object from the bucket. Silently ignores missing keys. */
  async deleteKey(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: [{ Key: key }] },
      }),
    );
  }

  /**
   * Copies each tmp/ object to a permanent properties/{propertyId}/ key and
   * deletes the tmp/ originals. Returns the new permanent keys in the same
   * order as the input. Throws if any copy fails — callers decide how to
   * handle a partially-promoted gallery.
   */
  async promoteKeys(tmpKeys: string[], propertyId: string): Promise<string[]> {
    const promotedKeys = await Promise.all(
      tmpKeys.map(async (tmpKey) => {
        const filename = tmpKey.split("/").pop();
        const newKey = `properties/${propertyId}/${filename}`;

        await this.client.send(
          new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${tmpKey}`,
            Key: newKey,
          }),
        );

        return newKey;
      }),
    );

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: tmpKeys.map((Key) => ({ Key })) },
      }),
    );

    return promotedKeys;
  }
}
