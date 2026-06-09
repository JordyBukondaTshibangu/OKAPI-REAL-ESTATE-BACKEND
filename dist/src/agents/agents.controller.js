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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_admin_guard_1 = require("../auth/guards/jwt-admin.guard");
const agents_service_1 = require("./agents.service");
const create_agent_dto_1 = require("./dto/create-agent.dto");
const filter_agent_dto_1 = require("./dto/filter-agent.dto");
const update_agent_dto_1 = require("./dto/update-agent.dto");
const update_photo_dto_1 = require("./dto/update-photo.dto");
let AgentsController = class AgentsController {
    agentsService;
    constructor(agentsService) {
        this.agentsService = agentsService;
    }
    findAll(query) {
        return this.agentsService.findAll(query);
    }
    findOne(id) {
        return this.agentsService.findOne(id);
    }
    create(dto) {
        return this.agentsService.create(dto);
    }
    update(id, dto) {
        return this.agentsService.update(id, dto);
    }
    updatePhoto(id, dto) {
        return this.agentsService.updatePhoto(id, dto.key);
    }
    remove(id) {
        return this.agentsService.remove(id);
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_agent_dto_1.FilterAgentDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_agent_dto_1.CreateAgentDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_agent_dto_1.UpdateAgentDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Patch)(":id/photo"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_photo_dto_1.UpdatePhotoDto]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "updatePhoto", null);
__decorate([
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgentsController.prototype, "remove", null);
exports.AgentsController = AgentsController = __decorate([
    (0, common_1.Controller)("agents"),
    __metadata("design:paramtypes", [agents_service_1.AgentsService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map