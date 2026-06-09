import { PresignFileDto } from "./dto/presign-upload.dto";
export declare function toR2Url(key: string): string;
export declare class UploadsService {
    private readonly client;
    private readonly bucket;
    constructor();
    createPresignedUploads(files: PresignFileDto[]): Promise<{
        key: string;
        url: string;
    }[]>;
    promoteToPrefix(tmpKey: string, prefix: string): Promise<string>;
    deleteKey(key: string): Promise<void>;
    promoteKeys(tmpKeys: string[], propertyId: string): Promise<string[]>;
}
