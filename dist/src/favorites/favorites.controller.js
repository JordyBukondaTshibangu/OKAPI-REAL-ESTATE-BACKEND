"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_user_guard_1 = require("../auth/guards/jwt-user.guard");
const create_favorite_dto_1 = require("./dto/create-favorite.dto");
const favorites_service_1 = require("./favorites.service");
let FavoritesController = class FavoritesController {
    favoritesService;
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    add(req, dto) {
        return this.favoritesService.addFavorite(req.user.userId, dto);
    }
    remove(req, propertyId) {
        return this.favoritesService.removeFavorite(req.user.userId, propertyId);
    }
    getAll(req) {
        return this.favoritesService.getMyFavorites(req.user.userId);
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add a property to favorites" }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_favorite_dto_1.CreateFavoriteDto]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "add", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Remove a property from favorites" }),
    (0, common_1.Delete)(":propertyId"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("propertyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get my favorite properties" }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FavoritesController.prototype, "getAll", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, swagger_1.ApiTags)("Favorites"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_user_guard_1.JwtUserGuard),
    (0, common_1.Controller)("favorites"),
    __metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
//# sourceMappingURL=favorites.controller.js.map