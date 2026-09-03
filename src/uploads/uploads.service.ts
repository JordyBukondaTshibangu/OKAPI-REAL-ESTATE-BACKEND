import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import sharp from "sharp";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PresignFileDto } from "./dto/presign-upload.dto";

export function toR2Url(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

const PRESIGN_TTL_SECONDS = 5 * 60;

@Injectable()
export class UploadsService implements OnModuleInit {
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
      // Disable automatic CRC32 checksum injection so presigned PUT URLs don't
      // include x-amz-checksum-* query params that trigger CORS preflight issues.
      requestChecksumCalculation: "when_required" as any,
      responseChecksumValidation: "when_required" as any,
    });
  }

  /** Configure R2 bucket CORS on startup so browser PUT uploads work cross-origin. */
  async onModuleInit() {
    const raw = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? "";
    const origins = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // Allow all origins when none are configured (dev mode).
    const allowedOrigins = origins.length > 0 ? origins : ["*"];

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: allowedOrigins,
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                AllowedHeaders: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
      console.log("[R2 CORS] Rules applied for origins:", allowedOrigins);
    } catch (err: any) {
      // Log but don't crash the app — CORS may already be set via the dashboard.
      console.warn("[R2 CORS] Could not apply CORS rules:", err?.message ?? err);
    }
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

  /** Downloads a key from R2 and returns its bytes as a Buffer. */
  private async downloadKey(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  /**
   * Applies a subtle "Okapi Real Estate" watermark to an image buffer.
   * Falls back to the original bytes if sharp fails (e.g. unsupported format).
   */
  private async applyWatermark(input: Buffer): Promise<Buffer> {
    try {
      const { width = 800, height = 600 } = await sharp(input).metadata();
      const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.035));
      const padRight = Math.round(width * 0.02);
      const padBottom = Math.round(height * 0.03);
      const textW = fontSize * 14; // rough estimate for "Okapi Real Estate"
      const textH = fontSize + 8;

      const svgOverlay = Buffer.from(
        `<svg width="${textW}" height="${textH}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="4" fill="rgba(0,0,0,0.32)" />
          <text
            x="50%" y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="${fontSize}px"
            fill="rgba(255,255,255,0.72)"
            font-weight="600"
            letter-spacing="0.5"
          >Okapi Real Estate</text>
        </svg>`,
      );

      return await sharp(input)
        .composite([{
          input: svgOverlay,
          gravity: "southeast",
          top: height - textH - padBottom,
          left: width - textW - padRight,
        }])
        .jpeg({ quality: 88 })
        .toBuffer();
    } catch (err) {
      console.warn("[watermark] Could not apply watermark, using original:", err);
      return input;
    }
  }

  /**
   * Downloads each tmp/ image, stamps the Okapi watermark, uploads to the
   * permanent properties/{propertyId}/ key, then deletes the tmp/ originals.
   * Returns the new permanent keys in the same order as the input.
   */
  async promoteKeys(tmpKeys: string[], propertyId: string): Promise<string[]> {
    const promotedKeys = await Promise.all(
      tmpKeys.map(async (tmpKey) => {
        const filename = tmpKey.split("/").pop();
        const newKey = `properties/${propertyId}/${filename}`;

        // Download → watermark → re-upload (instead of a plain server-side copy)
        const original = await this.downloadKey(tmpKey);
        const watermarked = await this.applyWatermark(original);

        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: newKey,
            Body: watermarked,
            ContentType: "image/jpeg",
          }),
        );

        return newKey;
      }),
    );

    // Clean up tmp/ originals after all uploads succeed
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: tmpKeys.map((Key) => ({ Key })) },
      }),
    );

    return promotedKeys;
  }
}
