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
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PresignFileDto } from "./dto/presign-upload.dto";

// Pre-baked watermark PNG (277×50, gold text on navy, generated at build time).
// Loaded once at module load — avoids any runtime font dependency.
const WATERMARK_PNG: Buffer = (() => {
  // Try multiple candidate paths so this works whether running from:
  //   - compiled dist  (__dirname = .../dist/src/uploads)
  //   - ts-node dev    (__dirname = .../src/uploads)
  //   - project root fallback
  const candidates = [
    join(__dirname, "watermark.png"),
    join(__dirname, "..", "..", "..", "src", "uploads", "watermark.png"),
    join(process.cwd(), "src", "uploads", "watermark.png"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p);
  }
  throw new Error(`watermark.png not found. Tried:\n${candidates.join("\n")}`);
})();

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
      console.warn(
        "[R2 CORS] Could not apply CORS rules:",
        err?.message ?? err,
      );
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
      const meta = await sharp(input).metadata();
      const width = meta.width ?? 800;
      const height = meta.height ?? 600;

      // Scale the pre-baked watermark PNG to ~28% of the image width.
      const targetW = Math.max(180, Math.round(width * 0.28));
      const scaled = await sharp(WATERMARK_PNG)
        .resize(targetW, null, { fit: "inside" })
        .toBuffer();
      const scaledMeta = await sharp(scaled).metadata();
      const wW = scaledMeta.width ?? targetW;
      const wH = scaledMeta.height ?? 50;

      const marginRight = Math.round(width * 0.025);
      const marginBottom = Math.round(height * 0.03);
      const left = Math.max(0, width - wW - marginRight);
      const top = Math.max(0, height - wH - marginBottom);

      return await sharp(input)
        .composite([{ input: scaled, top, left }])
        .jpeg({ quality: 88 })
        .toBuffer();
    } catch (err) {
      console.warn(
        "[watermark] Could not apply watermark, using original:",
        err,
      );
      return input;
    }
  }

  /**
   * Validates photo dimensions — throws if any image is below the minimum size.
   * Called before watermarking so we reject bad photos early.
   */
  private async validatePhotoDimensions(input: Buffer, filename: string): Promise<void> {
    const MIN_WIDTH = 800;
    const MIN_HEIGHT = 600;
    try {
      const meta = await sharp(input).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (w < MIN_WIDTH || h < MIN_HEIGHT) {
        throw new Error(
          `Photo "${filename}" trop petite (${w}×${h} px). Minimum requis : ${MIN_WIDTH}×${MIN_HEIGHT} px.`,
        );
      }
    } catch (err: any) {
      // Re-throw dimension errors; swallow unreadable format errors gracefully
      if (err.message?.includes("trop petite")) throw err;
      console.warn(`[uploads] Could not read metadata for ${filename}:`, err.message);
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

        // Download → validate dimensions → watermark → re-upload
        const original = await this.downloadKey(tmpKey);
        await this.validatePhotoDimensions(original, filename ?? tmpKey);
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
