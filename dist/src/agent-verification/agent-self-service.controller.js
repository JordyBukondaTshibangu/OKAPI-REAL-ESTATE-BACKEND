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
exports.AgentSelfServiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_agent_guard_1 = require("../auth/guards/jwt-agent.guard");
const agent_verification_service_1 = require("./agent-verification.service");
const request_reference_dto_1 = require("./dto/request-reference.dto");
const submit_id_document_dto_1 = require("./dto/submit-id-document.dto");
let AgentSelfServiceController = class AgentSelfServiceController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    submitIdDocument(req, dto) {
        return this.verification.submitIdDocument(req.user.agentId, dto.key);
    }
    requestReference(req, dto) {
        return this.verification.requestReference(req.user.agentId, dto);
    }
};
exports.AgentSelfServiceController = AgentSelfServiceController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Submit an ID document for Tier 1 -> Tier 2 review" }),
    (0, common_1.Post)("id-document"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_id_document_dto_1.SubmitIdDocumentDto]),
    __metadata("design:returntype", void 0)
], AgentSelfServiceController.prototype, "submitIdDocument", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Request a reference/vouch (agent, agency, or commissionnaire)" }),
    (0, common_1.Post)("references"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_reference_dto_1.RequestReferenceDto]),
    __metadata("design:returntype", void 0)
], AgentSelfServiceController.prototype, "requestReference", null);
exports.AgentSelfServiceController = AgentSelfServiceController = __decorate([
    (0, swagger_1.ApiTags)("Agent Verification - Self Service"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_agent_guard_1.JwtAgentGuard),
    (0, common_1.Controller)("agents/me"),
    __metadata("design:paramtypes", [agent_verification_service_1.AgentVerificationService])
], AgentSelfServiceController);
//# sourceMappingURL=agent-self-service.controller.js.map