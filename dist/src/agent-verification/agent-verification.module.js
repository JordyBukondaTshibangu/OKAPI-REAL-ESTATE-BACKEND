"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const uploads_module_1 = require("../uploads/uploads.module");
const admin_agency_verification_controller_1 = require("./admin-agency-verification.controller");
const admin_agent_verification_controller_1 = require("./admin-agent-verification.controller");
const agent_complaints_controller_1 = require("./agent-complaints.controller");
const agent_self_service_controller_1 = require("./agent-self-service.controller");
const agent_verification_service_1 = require("./agent-verification.service");
const agency_self_service_controller_1 = require("./agency-self-service.controller");
let AgentVerificationModule = class AgentVerificationModule {
};
exports.AgentVerificationModule = AgentVerificationModule;
exports.AgentVerificationModule = AgentVerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [uploads_module_1.UploadsModule],
        controllers: [
            agent_self_service_controller_1.AgentSelfServiceController,
            agency_self_service_controller_1.AgencySelfServiceController,
            admin_agent_verification_controller_1.AdminAgentVerificationController,
            admin_agency_verification_controller_1.AdminAgencyVerificationController,
            agent_complaints_controller_1.AgentComplaintsController,
        ],
        providers: [agent_verification_service_1.AgentVerificationService],
    })
], AgentVerificationModule);
//# sourceMappingURL=agent-verification.module.js.map