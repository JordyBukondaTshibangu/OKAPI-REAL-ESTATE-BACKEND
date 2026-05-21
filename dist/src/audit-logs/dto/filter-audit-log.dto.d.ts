import { PaginationDto } from "../../common/dto/pagination.dto";
export declare class FilterAuditLogDto extends PaginationDto {
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
