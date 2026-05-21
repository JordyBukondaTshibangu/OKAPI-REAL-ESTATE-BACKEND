"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const admin_auth_controller_1 = require("./admin/admin-auth.controller");
const admin_auth_service_1 = require("./admin/admin-auth.service");
const jwt_admin_strategy_1 = require("./strategies/jwt-admin.strategy");
const jwt_user_strategy_1 = require("./strategies/jwt-user.strategy");
const user_auth_controller_1 = require("./user/user-auth.controller");
const user_auth_service_1 = require("./user/user-auth.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET ?? "secret",
                signOptions: { expiresIn: "7d" },
            }),
        ],
        controllers: [user_auth_controller_1.UserAuthController, admin_auth_controller_1.AdminAuthController],
        providers: [
            user_auth_service_1.UserAuthService,
            admin_auth_service_1.AdminAuthService,
            jwt_user_strategy_1.JwtUserStrategy,
            jwt_admin_strategy_1.JwtAdminStrategy,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map