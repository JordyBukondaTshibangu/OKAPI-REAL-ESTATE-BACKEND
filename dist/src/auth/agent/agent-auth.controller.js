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
exports.AgentAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_auth_service_1 = require("./agent-auth.service");
const forgot_password_agent_dto_1 = require("./dto/forgot-password-agent.dto");
const login_agent_dto_1 = require("./dto/login-agent.dto");
const register_agent_dto_1 = require("./dto/register-agent.dto");
const reset_password_agent_dto_1 = require("./dto/reset-password-agent.dto");
let AgentAuthController = class AgentAuthController {
    agentAuthService;
    constructor(agentAuthService) {
        this.agentAuthService = agentAuthService;
    }
    register(dto) {
        return this.agentAuthService.register(dto);
    }
    login(dto) {
        return this.agentAuthService.login(dto);
    }
    forgotPassword(dto) {
        return this.agentAuthService.forgotPassword(dto);
    }
    resetPassword(dto) {
        return this.agentAuthService.resetPassword(dto);
    }
};
exports.AgentAuthController = AgentAuthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Self-register as a new agent (Tier 1 - Non-vérifié)" }),
    (0, common_1.Post)("register"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_agent_dto_1.RegisterAgentDto]),
    __metadata("design:returntype", void 0)
], AgentAuthController.prototype, "register", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Agent login" }),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_agent_dto_1.LoginAgentDto]),
    __metadata("design:returntype", void 0)
], AgentAuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Request password reset email" }),
    (0, common_1.Post)("forgot-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_agent_dto_1.ForgotPasswordAgentDto]),
    __metadata("design:returntype", void 0)
], AgentAuthController.prototype, "forgotPassword", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Reset password using token from email" }),
    (0, common_1.Post)("reset-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_agent_dto_1.ResetPasswordAgentDto]),
    __metadata("design:returntype", void 0)
], AgentAuthController.prototype, "resetPassword", null);
exports.AgentAuthController = AgentAuthController = __decorate([
    (0, swagger_1.ApiTags)("Auth - Agent"),
    (0, common_1.Controller)("auth/agent"),
    __metadata("design:paramtypes", [agent_auth_service_1.AgentAuthService])
], AgentAuthController);
//# sourceMappingURL=agent-auth.controller.js.map