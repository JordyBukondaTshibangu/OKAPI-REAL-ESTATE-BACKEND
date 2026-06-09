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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_admin_guard_1 = require("../auth/guards/jwt-admin.guard");
const presign_upload_dto_1 = require("./dto/presign-upload.dto");
const uploads_service_1 = require("./uploads.service");
let UploadsController = class UploadsController {
    uploadsService;
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    presign(dto) {
        return this.uploadsService.createPresignedUploads(dto.files);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)("presign"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [presign_upload_dto_1.PresignUploadDto]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "presign", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.Controller)("uploads"),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map