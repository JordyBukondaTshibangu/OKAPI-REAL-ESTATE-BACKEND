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
exports.EnquiriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_user_guard_1 = require("../auth/guards/jwt-user.guard");
const create_enquiry_dto_1 = require("./dto/create-enquiry.dto");
const enquiries_service_1 = require("./enquiries.service");
let EnquiriesController = class EnquiriesController {
    enquiriesService;
    constructor(enquiriesService) {
        this.enquiriesService = enquiriesService;
    }
    create(req, dto) {
        return this.enquiriesService.create(req.user.userId, dto);
    }
    getAll(req) {
        return this.enquiriesService.getMyEnquiries(req.user.userId);
    }
    getForProperty(propertyId) {
        return this.enquiriesService.getEnquiriesForProperty(propertyId);
    }
    delete(req, id) {
        return this.enquiriesService.delete(req.user.userId, id);
    }
};
exports.EnquiriesController = EnquiriesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Submit an enquiry for a property" }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_enquiry_dto_1.CreateEnquiryDto]),
    __metadata("design:returntype", void 0)
], EnquiriesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get my enquiries" }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnquiriesController.prototype, "getAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get all enquiries for a specific property" }),
    (0, common_1.Get)("property/:propertyId"),
    __param(0, (0, common_1.Param)("propertyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EnquiriesController.prototype, "getForProperty", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Delete an enquiry" }),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnquiriesController.prototype, "delete", null);
exports.EnquiriesController = EnquiriesController = __decorate([
    (0, swagger_1.ApiTags)("Enquiries"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_user_guard_1.JwtUserGuard),
    (0, common_1.Controller)("enquiries"),
    __metadata("design:paramtypes", [enquiries_service_1.EnquiriesService])
], EnquiriesController);
//# sourceMappingURL=enquiries.controller.js.map