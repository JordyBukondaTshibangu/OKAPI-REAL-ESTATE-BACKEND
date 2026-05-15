import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class FilterAuditLogDto extends PaginationDto {
  @ApiPropertyOptional({ example: "2026-01-01", description: "Filter logs from this date (inclusive)" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: "2026-12-31", description: "Filter logs until this date (inclusive)" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: "CREATE", description: "Search in action, resource, or details" })
  @IsOptional()
  @IsString()
  search?: string;
}
