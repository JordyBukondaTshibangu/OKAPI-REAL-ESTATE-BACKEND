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
exports.AgentComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_user_guard_1 = require("../auth/guards/jwt-user.guard");
const agent_verification_service_1 = require("./agent-verification.service");
const file_complaint_dto_1 = require("./dto/file-complaint.dto");
let AgentComplaintsController = class AgentComplaintsController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    fileComplaint(agentId, req, dto) {
        return this.verification.fileComplaint(agentId, req.user.userId, dto);
    }
};
exports.AgentComplaintsController = AgentComplaintsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "File a complaint against an agent — triggers re-review past a threshold" }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)("agentId")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, file_complaint_dto_1.FileComplaintDto]),
    __metadata("design:returntype", void 0)
], AgentComplaintsController.prototype, "fileComplaint", null);
exports.AgentComplaintsController = AgentComplaintsController = __decorate([
    (0, swagger_1.ApiTags)("Agent Complaints"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_user_guard_1.JwtUserGuard),
    (0, common_1.Controller)("agents/:agentId/complaints"),
    __metadata("design:paramtypes", [agent_verification_service_1.AgentVerificationService])
], AgentComplaintsController);
//# sourceMappingURL=agent-complaints.controller.js.map