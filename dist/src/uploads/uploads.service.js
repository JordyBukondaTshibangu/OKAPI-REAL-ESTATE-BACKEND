"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const PRESIGN_TTL_SECONDS = 5 * 60;
let UploadsService = class UploadsService {
    client;
    bucket;
    constructor() {
        this.bucket = process.env.R2_BUCKET_NAME ?? "";
        this.client = new client_s3_1.S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
            },
        });
    }
    async createPresignedUploads(files) {
        return Promise.all(files.map(async (file) => {
            const extension = file.filename.split(".").pop()?.toLowerCase();
            const key = `tmp/${(0, crypto_1.randomUUID)()}${extension ? `.${extension}` : ""}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: file.contentType,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
                expiresIn: PRESIGN_TTL_SECONDS,
            });
            return { key, url };
        }));
    }
    async promoteKeys(tmpKeys, propertyId) {
        const promotedKeys = await Promise.all(tmpKeys.map(async (tmpKey) => {
            const filename = tmpKey.split("/").pop();
            const newKey = `properties/${propertyId}/${filename}`;
            await this.client.send(new client_s3_1.CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${tmpKey}`,
                Key: newKey,
            }));
            return newKey;
        }));
        await this.client.send(new client_s3_1.DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: tmpKeys.map((Key) => ({ Key })) },
        }));
        return promotedKeys;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map