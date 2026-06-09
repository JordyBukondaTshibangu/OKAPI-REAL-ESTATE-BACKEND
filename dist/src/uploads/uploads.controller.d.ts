import { PresignUploadDto } from "./dto/presign-upload.dto";
import { UploadsService } from "./uploads.service";
export declare class UploadsController {
    private uploadsService;
    constructor(uploadsService: UploadsService);
    presign(dto: PresignUploadDto): Promise<{
        key: string;
        url: string;
    }[]>;
}
