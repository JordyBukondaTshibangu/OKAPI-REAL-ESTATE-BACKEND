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
exports.AdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_admin_guard_1 = require("../guards/jwt-admin.guard");
const admin_auth_service_1 = require("./admin-auth.service");
const admin_login_dto_1 = require("./dto/admin-login.dto");
let AdminAuthController = class AdminAuthController {
    adminAuthService;
    constructor(adminAuthService) {
        this.adminAuthService = adminAuthService;
    }
    login(dto) {
        console.log("Loagin in");
        return this.adminAuthService.login(dto);
    }
    logout() {
        return { message: "Logged out successfully" };
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Admin login" }),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", void 0)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Admin logout" }),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Post)("logout"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAuthController.prototype, "logout", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, swagger_1.ApiTags)("Auth - Admin"),
    (0, common_1.Controller)("auth/admin"),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAuthController);
//# sourceMappingURL=admin-auth.controller.js.map