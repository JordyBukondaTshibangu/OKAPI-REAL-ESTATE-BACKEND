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
exports.AdminAgencyVerificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_admin_guard_1 = require("../auth/guards/jwt-admin.guard");
const agent_verification_service_1 = require("./agent-verification.service");
let AdminAgencyVerificationController = class AdminAgencyVerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    approve(agencyId) {
        return this.verification.approveAgency(agencyId);
    }
    reject(agencyId) {
        return this.verification.rejectAgency(agencyId);
    }
};
exports.AdminAgencyVerificationController = AdminAgencyVerificationController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: "Approve an agency (requires business proof + 1 already-verified staff agent)",
    }),
    (0, common_1.Patch)(":agencyId/approve"),
    __param(0, (0, common_1.Param)("agencyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminAgencyVerificationController.prototype, "approve", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Reject an agency's verification request" }),
    (0, common_1.Patch)(":agencyId/reject"),
    __param(0, (0, common_1.Param)("agencyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminAgencyVerificationController.prototype, "reject", null);
exports.AdminAgencyVerificationController = AdminAgencyVerificationController = __decorate([
    (0, swagger_1.ApiTags)("Admin - Agency Verification"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Controller)("admin/agency-verifications"),
    __metadata("design:paramtypes", [agent_verification_service_1.AgentVerificationService])
], AdminAgencyVerificationController);
//# sourceMappingURL=admin-agency-verification.controller.js.map