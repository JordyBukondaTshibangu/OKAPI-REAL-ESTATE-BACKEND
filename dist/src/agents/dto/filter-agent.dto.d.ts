import { PaginationDto } from "../../common/dto/pagination.dto";
export declare class FilterAgentDto extends PaginationDto {
    search?: string;
    name?: string;
    title?: string;
    specialization?: string;
    language?: string;
    nationality?: string;
    sortBy?: "name" | "title" | "agency" | "rating" | "closedDeals";
    sortOrder?: "asc" | "desc";
}
