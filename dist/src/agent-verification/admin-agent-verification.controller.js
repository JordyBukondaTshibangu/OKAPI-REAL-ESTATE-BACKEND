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
exports.AdminAgentVerificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_admin_guard_1 = require("../auth/guards/jwt-admin.guard");
const agent_verification_service_1 = require("./agent-verification.service");
const review_id_document_dto_1 = require("./dto/review-id-document.dto");
const review_reference_dto_1 = require("./dto/review-reference.dto");
const set_flagged_dto_1 = require("./dto/set-flagged.dto");
const set_tier_dto_1 = require("./dto/set-tier.dto");
const spot_check_dto_1 = require("./dto/spot-check.dto");
let AdminAgentVerificationController = class AdminAgentVerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    listPending() {
        return this.verification.listPending();
    }
    listFlagged() {
        return this.verification.listFlagged();
    }
    getAgentDetail(agentId) {
        return this.verification.getAgentDetail(agentId);
    }
    reviewIdDocument(agentId, dto) {
        return this.verification.reviewIdDocument(agentId, dto.status);
    }
    reviewReference(referenceId, dto) {
        return this.verification.reviewReference(referenceId, dto.status, dto.note);
    }
    spotCheck(agentId, dto) {
        return this.verification.spotCheckFirstListing(agentId, dto.passed);
    }
    setTier(agentId, dto) {
        return this.verification.setTier(agentId, dto.tier);
    }
    setFlagged(agentId, dto) {
        return this.verification.setFlagged(agentId, dto.flagged);
    }
    evaluateTierPromotions() {
        return this.verification.evaluateTierPromotions();
    }
};
exports.AdminAgentVerificationController = AdminAgentVerificationController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Agents awaiting Tier 1 -> Tier 2 review" }),
    (0, common_1.Get)("pending"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "listPending", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Agents flagged for re-review (complaints, bad vouches)" }),
    (0, common_1.Get)("flagged"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "listFlagged", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Full verification detail for one agent" }),
    (0, common_1.Get)(":agentId"),
    __param(0, (0, common_1.Param)("agentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "getAgentDetail", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Approve or reject an agent's ID document" }),
    (0, common_1.Patch)(":agentId/id-document"),
    __param(0, (0, common_1.Param)("agentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_id_document_dto_1.ReviewIdDocumentDto]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "reviewIdDocument", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Confirm, revoke, or flag a reference/vouch" }),
    (0, common_1.Patch)("references/:referenceId"),
    __param(0, (0, common_1.Param)("referenceId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_reference_dto_1.ReviewReferenceDto]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "reviewReference", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Record the manual spot-check on an agent's first listing" }),
    (0, common_1.Patch)(":agentId/spot-check"),
    __param(0, (0, common_1.Param)("agentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, spot_check_dto_1.SpotCheckDto]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "spotCheck", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Manually set an agent's tier (override / demotion / correction)" }),
    (0, common_1.Patch)(":agentId/tier"),
    __param(0, (0, common_1.Param)("agentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_tier_dto_1.SetTierDto]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "setTier", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Flag or clear an agent for re-review" }),
    (0, common_1.Patch)(":agentId/flag"),
    __param(0, (0, common_1.Param)("agentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_flagged_dto_1.SetFlaggedDto]),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "setFlagged", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: "Run the automated Tier 2 -> Tier 3 promotion sweep (90+ days, 10+ deals, low complaints)",
    }),
    (0, common_1.Post)("evaluate-tier3"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAgentVerificationController.prototype, "evaluateTierPromotions", null);
exports.AdminAgentVerificationController = AdminAgentVerificationController = __decorate([
    (0, swagger_1.ApiTags)("Admin - Agent Verification"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Controller)("admin/agent-verifications"),
    __metadata("design:paramtypes", [agent_verification_service_1.AgentVerificationService])
], AdminAgentVerificationController);
//# sourceMappingURL=admin-agent-verification.controller.js.map