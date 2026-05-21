import { PaginationDto } from "../../common/dto/pagination.dto";
export declare class FilterAgencyDto extends PaginationDto {
    search?: string;
    name?: string;
    language?: string;
    sortBy?: "name" | "agentCount" | "listingCount" | "founded";
    sortOrder?: "asc" | "desc";
}
