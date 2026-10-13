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

// Okapi logo PNG — used as the centred watermark on every property photo.
// Loaded once at module load to avoid repeated I/O.
const LOGO_PNG: Buffer = (() => {
  const candidates = [
    join(__dirname, "logo.png"),
    join(__dirname, "..", "..", "..", "src", "uploads", "logo.png"),
    join(process.cwd(), "src", "uploads", "logo.png"),
    // Fallback to legacy watermark.png if logo hasn't been deployed yet
    join(__dirname, "watermark.png"),
    join(__dirname, "..", "..", "..", "src", "uploads", "watermark.png"),
    join(process.cwd(), "src", "uploads", "watermark.png"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p);
  }
  throw new Error(`logo.png not found. Tried:\n${candidates.join("\n")}`);
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
   * Applies the Okapi logo as a centred watermark and optionally overlays
   * the agent's name at the top-left and bottom-right corners.
   * Falls back to the original bytes if sharp fails (e.g. unsupported format).
   */
  private async applyWatermark(
    input: Buffer,
    agentName?: string,
  ): Promise<Buffer> {
    try {
      const meta = await sharp(input).metadata();
      const width = meta.width ?? 800;
      const height = meta.height ?? 600;

      // ── 1. Centre logo ─────────────────────────────────────────────────────
      // Scale the logo to ~38% of the image width, then reduce to ~18% opacity
      // so the photo shows through clearly (same style as industry watermarks).
      const logoTargetW = Math.max(200, Math.round(width * 0.38));
      const logoResized = await sharp(LOGO_PNG)
        .resize(logoTargetW, null, { fit: "inside" })
        .ensureAlpha()
        .png()
        .toBuffer();

      // Reduce alpha channel to 18% via raw pixel manipulation
      const { data: rawData, info: rawInfo } = await sharp(logoResized)
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let i = 3; i < rawData.length; i += 4) {
        rawData[i] = Math.round(rawData[i] * 0.18);
      }
      const logoTransparent = await sharp(rawData, {
        raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 },
      })
        .png()
        .toBuffer();

      const lW = rawInfo.width;
      const lH = rawInfo.height;
      const logoLeft = Math.max(0, Math.round((width - lW) / 2));
      const logoTop = Math.max(0, Math.round((height - lH) / 2));

      const composites: sharp.OverlayOptions[] = [
        { input: logoTransparent, top: logoTop, left: logoLeft, blend: "over" },
      ];

      // ── 2. Agent name text overlays (top-left + bottom-right) ──────────────
      if (agentName) {
        const fontSize = Math.max(14, Math.round(width * 0.025));
        const padding = Math.round(fontSize * 0.8);
        const safe = agentName.replace(
          /[<>&"']/g,
          (c) =>
            ({
              "<": "&lt;",
              ">": "&gt;",
              "&": "&amp;",
              '"': "&quot;",
              "'": "&apos;",
            })[c] ?? c,
        );

        // Semi-transparent dark pill background + white text
        const makeLabelSvg = (
          text: string,
          w: number,
          h: number,
          anchor: "start" | "end",
          x: number,
          y: number,
        ) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${anchor === "end" ? x - (text.length * fontSize * 0.6 + padding * 2) : x}"
        y="${y - fontSize - padding / 2}"
        width="${Math.round(text.length * fontSize * 0.6 + padding * 2)}"
        height="${fontSize + padding}"
        rx="4" ry="4"
        fill="rgba(0,0,0,0.45)" />
  <text x="${x}" y="${y - padding / 4}"
        font-family="Liberation Sans, DejaVu Sans, FreeSans, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        text-anchor="${anchor}"
        opacity="0.9">${text}</text>
</svg>`;

        const topLeftSvg = Buffer.from(
          makeLabelSvg(
            safe,
            width,
            height,
            "start",
            padding,
            fontSize + padding,
          ),
        );
        const bottomRightSvg = Buffer.from(
          makeLabelSvg(
            safe,
            width,
            height,
            "end",
            width - padding,
            height - padding,
          ),
        );

        composites.push(
          { input: topLeftSvg, top: 0, left: 0, blend: "over" },
          { input: bottomRightSvg, top: 0, left: 0, blend: "over" },
        );
      }

      return await sharp(input)
        .composite(composites)
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
   * Downloads each tmp/ image, stamps the Okapi watermark, uploads to the
   * permanent properties/{propertyId}/ key, then deletes the tmp/ originals.
   * Returns the new permanent keys in the same order as the input.
   */
  async promoteKeys(
    tmpKeys: string[],
    propertyId: string,
    agentName?: string,
  ): Promise<string[]> {
    const promotedKeys = await Promise.all(
      tmpKeys.map(async (tmpKey) => {
        const filename = tmpKey.split("/").pop();
        const newKey = `properties/${propertyId}/${filename}`;

        // Download → watermark → re-upload
        const original = await this.downloadKey(tmpKey);
        const watermarked = await this.applyWatermark(original, agentName);

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
