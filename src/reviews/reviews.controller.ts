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
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsService } from "./reviews.service";

@ApiTags("Reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @ApiOperation({ summary: "Submit a review for a property or agent" })
  @ApiBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Get my reviews" })
  @ApiBearerAuth()
  @UseGuards(JwtUserGuard)
  @Get("mine")
  getMyReviews(@Request() req: any) {
    return this.reviewsService.getMyReviews(req.user.userId);
  }

  @ApiOperation({ summary: "Get reviews for a property" })
  @Get("property/:propertyId")
  getPropertyReviews(@Param("propertyId") propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @ApiOperation({ summary: "Get reviews for an agent" })
  @Get("agent/:agentId")
  getAgentReviews(@Param("agentId") agentId: string) {
    return this.reviewsService.getAgentReviews(agentId);
  }

  @ApiOperation({ summary: "Delete a review" })
  @ApiBearerAuth()
  @UseGuards(JwtUserGuard)
  @Delete(":id")
  delete(@Request() req: any, @Param("id") id: string) {
    return this.reviewsService.delete(req.user.userId, id);
  }
}
