import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { EnquiriesService } from "./enquiries.service";

@ApiTags("Enquiries")
@ApiBearerAuth()
@UseGuards(JwtUserGuard)
@Controller("enquiries")
export class EnquiriesController {
  constructor(private enquiriesService: EnquiriesService) {}

  @ApiOperation({ summary: "Submit an enquiry for a property" })
  @Post()
  create(@Request() req: any, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Get my enquiries" })
  @Get()
  getAll(@Request() req: any) {
    return this.enquiriesService.getMyEnquiries(req.user.userId);
  }

  @ApiOperation({ summary: "Get all enquiries for a specific property" })
  @Get("property/:propertyId")
  getForProperty(@Param("propertyId") propertyId: string) {
    return this.enquiriesService.getEnquiriesForProperty(propertyId);
  }

  @ApiOperation({ summary: "Delete an enquiry" })
  @Delete(":id")
  delete(@Request() req: any, @Param("id") id: string) {
    return this.enquiriesService.delete(req.user.userId, id);
  }
}
