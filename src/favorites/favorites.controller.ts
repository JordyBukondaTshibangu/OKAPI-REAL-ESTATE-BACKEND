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
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";

@ApiTags("Favorites")
@ApiBearerAuth()
@UseGuards(JwtUserGuard)
@Controller("favorites")
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @ApiOperation({ summary: "Add a property to favorites" })
  @Post()
  add(@Request() req: any, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.addFavorite(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Remove a property from favorites" })
  @Delete(":propertyId")
  remove(@Request() req: any, @Param("propertyId") propertyId: string) {
    return this.favoritesService.removeFavorite(req.user.userId, propertyId);
  }

  @ApiOperation({ summary: "Get my favorite properties" })
  @Get()
  getAll(@Request() req: any) {
    return this.favoritesService.getMyFavorites(req.user.userId);
  }
}
