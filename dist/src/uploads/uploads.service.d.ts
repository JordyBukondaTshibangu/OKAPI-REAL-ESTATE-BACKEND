import { PresignFileDto } from "./dto/presign-upload.dto";
export declare class UploadsService {
    private readonly client;
    private readonly bucket;
    constructor();
    createPresignedUploads(files: PresignFileDto[]): Promise<{
        key: string;
        url: string;
    }[]>;
    promoteKeys(tmpKeys: string[], propertyId: string): Promise<string[]>;
}
