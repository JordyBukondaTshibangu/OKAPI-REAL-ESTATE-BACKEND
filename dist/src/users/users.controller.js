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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_user_guard_1 = require("../auth/guards/jwt-user.guard");
const update_avatar_dto_1 = require("./dto/update-avatar.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMe(req) {
        return this.usersService.findMe(req.user.userId);
    }
    updateMe(req, dto) {
        return this.usersService.updateMe(req.user.userId, dto);
    }
    updateAvatar(req, dto) {
        return this.usersService.updateAvatar(req.user.userId, dto.key);
    }
    removeAvatar(req) {
        return this.usersService.removeAvatar(req.user.userId);
    }
    deleteMe(req) {
        return this.usersService.deleteMe(req.user.userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get my profile" }),
    (0, common_1.Get)("me"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Update my profile" }),
    (0, common_1.Patch)("me"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Set profile picture from a presigned R2 upload (use POST /uploads/presign-avatar first)" }),
    (0, common_1.Patch)("me/avatar"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_avatar_dto_1.UpdateAvatarDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateAvatar", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Remove profile picture" }),
    (0, common_1.Delete)("me/avatar"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "removeAvatar", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Delete my account" }),
    (0, common_1.Delete)("me"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMe", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)("Users"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_user_guard_1.JwtUserGuard),
    (0, common_1.Controller)("users"),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map