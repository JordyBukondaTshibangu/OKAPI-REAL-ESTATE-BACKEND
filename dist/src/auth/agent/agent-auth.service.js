"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const mail_service_1 = require("../../mail/mail.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let AgentAuthService = class AgentAuthService {
    prisma;
    jwt;
    mail;
    constructor(prisma, jwt, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mail = mail;
    }
    async register(dto) {
        const existingPhone = await this.prisma.agent.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (existingPhone)
            throw new common_1.ConflictException("Phone number already in use");
        if (dto.email) {
            const existingEmail = await this.prisma.agent.findUnique({
                where: { email: dto.email },
            });
            if (existingEmail)
                throw new common_1.ConflictException("Email already in use");
        }
        if (dto.agencyId) {
            const agency = await this.prisma.agency.findUnique({
                where: { id: dto.agencyId },
            });
            if (!agency)
                throw new common_1.BadRequestException("Agency not found");
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const agent = await this.prisma.agent.create({
            data: {
                name: dto.name,
                phoneNumber: dto.phoneNumber,
                whatsappNumber: dto.whatsappNumber,
                email: dto.email,
                passwordHash,
                agencyId: dto.agencyId,
            },
        });
        return {
            access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
            agent: { id: agent.id, name: agent.name, verificationTier: agent.verificationTier },
        };
    }
    async login(dto) {
        const agent = await this.prisma.agent.findFirst({
            where: { OR: [{ email: dto.identifier }, { phoneNumber: dto.identifier }] },
        });
        if (!agent || !agent.passwordHash) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const valid = await bcrypt.compare(dto.password, agent.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException("Invalid credentials");
        return {
            access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
            agent: { id: agent.id, name: agent.name, verificationTier: agent.verificationTier },
        };
    }
    async forgotPassword(dto) {
        const agent = await this.prisma.agent.findUnique({
            where: { email: dto.email },
        });
        if (!agent)
            return { message: "If that email exists, a reset link was sent" };
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.agent.update({
            where: { id: agent.id },
            data: { resetToken: token, resetTokenExpiry: expiry },
        });
        await this.mail.sendPasswordReset(agent.email, token, agent.name.split(" ")[0]);
        return { message: "If that email exists, a reset link was sent" };
    }
    async resetPassword(dto) {
        const agent = await this.prisma.agent.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!agent)
            throw new common_1.BadRequestException("Invalid or expired reset token");
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.agent.update({
            where: { id: agent.id },
            data: { passwordHash, resetToken: null, resetTokenExpiry: null },
        });
        return { message: "Password reset successful" };
    }
};
exports.AgentAuthService = AgentAuthService;
exports.AgentAuthService = AgentAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AgentAuthService);
//# sourceMappingURL=agent-auth.service.js.map