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
exports.AgencySelfServiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_agent_guard_1 = require("../auth/guards/jwt-agent.guard");
const agent_verification_service_1 = require("./agent-verification.service");
const submit_business_proof_dto_1 = require("./dto/submit-business-proof.dto");
let AgencySelfServiceController = class AgencySelfServiceController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    submitBusinessProof(agencyId, req, dto) {
        return this.verification.submitBusinessProof(agencyId, dto.key, req.user.agentId);
    }
};
exports.AgencySelfServiceController = AgencySelfServiceController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Submit business proof (e.g. RCCM) for agency verification — staff agent only" }),
    (0, common_1.Post)("business-proof"),
    __param(0, (0, common_1.Param)("agencyId")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, submit_business_proof_dto_1.SubmitBusinessProofDto]),
    __metadata("design:returntype", void 0)
], AgencySelfServiceController.prototype, "submitBusinessProof", null);
exports.AgencySelfServiceController = AgencySelfServiceController = __decorate([
    (0, swagger_1.ApiTags)("Agency Verification - Self Service"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_agent_guard_1.JwtAgentGuard),
    (0, common_1.Controller)("agencies/:agencyId"),
    __metadata("design:paramtypes", [agent_verification_service_1.AgentVerificationService])
], AgencySelfServiceController);
//# sourceMappingURL=agency-self-service.controller.js.map