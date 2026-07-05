import { ReferenceType } from "@prisma/client";
export declare class RequestReferenceDto {
    type: ReferenceType;
    voucherAgentId?: string;
    voucherAgencyId?: string;
    voucherName?: string;
    voucherContact?: string;
    note?: string;
}
