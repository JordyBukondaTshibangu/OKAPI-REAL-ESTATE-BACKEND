import { PaginationDto } from "../../common/dto/pagination.dto";
export declare class PropertyFilterDto extends PaginationDto {
    search?: string;
    agentId?: string;
    agencyId?: string;
    listingType?: string;
    category?: string;
    city?: string;
    suburb?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    period?: string;
    verified?: boolean;
    premium?: boolean;
    sortBy?: "price" | "title" | "listingType" | "category";
    sortOrder?: "asc" | "desc";
}
