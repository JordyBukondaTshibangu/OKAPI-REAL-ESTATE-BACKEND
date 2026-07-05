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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let AgentVerificationService = class AgentVerificationService {
    prisma;
    uploads;
    TIER3_MIN_DAYS = 90;
    TIER3_MIN_DEALS = 10;
    TIER3_MAX_COMPLAINT_RATE = 0.05;
    FLAG_COMPLAINT_THRESHOLD = 3;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    async submitIdDocument(agentId, tmpKey) {
        await this.getAgentOrThrow(agentId);
        const key = await this.uploads.promoteToPrefix(tmpKey, `agents/${agentId}/id-document`);
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { idDocumentUrl: key, idDocumentStatus: "PENDING" },
        });
        return { message: "ID document submitted for review" };
    }
    async requestReference(agentId, dto) {
        await this.getAgentOrThrow(agentId);
        if (dto.type === "AGENT") {
            if (!dto.voucherAgentId) {
                throw new common_1.BadRequestException("voucherAgentId is required for an AGENT reference");
            }
            const voucher = await this.prisma.agent.findUnique({ where: { id: dto.voucherAgentId } });
            if (!voucher)
                throw new common_1.BadRequestException("Voucher agent not found");
            if (voucher.verificationTier === "NON_VERIFIE") {
                throw new common_1.BadRequestException("The voucher must already be a verified agent");
            }
        }
        let voucherAgency = null;
        if (dto.type === "AGENCY") {
            if (!dto.voucherAgencyId) {
                throw new common_1.BadRequestException("voucherAgencyId is required for an AGENCY reference");
            }
            voucherAgency = await this.prisma.agency.findUnique({ where: { id: dto.voucherAgencyId } });
            if (!voucherAgency)
                throw new common_1.BadRequestException("Voucher agency not found");
        }
        const isAgencyFastTrack = dto.type === "AGENCY" && voucherAgency?.verificationStatus === "APPROVED";
        const reference = await this.prisma.agentReference.create({
            data: {
                agentId,
                type: dto.type,
                voucherAgentId: dto.voucherAgentId,
                voucherAgencyId: dto.voucherAgencyId,
                voucherName: dto.voucherName,
                voucherContact: dto.voucherContact,
                note: dto.note,
                status: isAgencyFastTrack ? "CONFIRMED" : "PENDING",
                reviewedAt: isAgencyFastTrack ? new Date() : null,
            },
        });
        if (isAgencyFastTrack)
            await this.maybePromoteToVerifie(agentId);
        return reference;
    }
    listPending() {
        return this.prisma.agent.findMany({
            where: { verificationTier: "NON_VERIFIE" },
            include: { agency: true, referencesReceived: true },
            orderBy: { createdAt: "asc" },
        });
    }
    listFlagged() {
        return this.prisma.agent.findMany({
            where: { flagged: true },
            include: { agency: true, complaints: true, referencesReceived: true },
            orderBy: { complaintCount: "desc" },
        });
    }
    async getAgentDetail(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { agency: true, referencesReceived: true, complaints: true },
        });
        if (!agent)
            throw new common_1.NotFoundException("Agent not found");
        return agent;
    }
    async reviewIdDocument(agentId, status) {
        await this.getAgentOrThrow(agentId);
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { idDocumentStatus: status },
        });
        if (status === "APPROVED")
            await this.maybePromoteToVerifie(agentId);
        return { message: `ID document ${status.toLowerCase()}` };
    }
    async reviewReference(referenceId, status, note) {
        const reference = await this.prisma.agentReference.findUnique({ where: { id: referenceId } });
        if (!reference)
            throw new common_1.NotFoundException("Reference not found");
        await this.prisma.agentReference.update({
            where: { id: referenceId },
            data: { status, note, reviewedAt: new Date() },
        });
        if (status === "FLAGGED") {
            await this.prisma.agent.update({
                where: { id: reference.agentId },
                data: { flagged: true },
            });
            if (reference.voucherAgentId) {
                await this.prisma.agent.update({
                    where: { id: reference.voucherAgentId },
                    data: { flagged: true },
                });
            }
            if (reference.voucherAgencyId) {
                await this.prisma.agency.update({
                    where: { id: reference.voucherAgencyId },
                    data: { standingFlagged: true },
                });
            }
        }
        if (status === "CONFIRMED")
            await this.maybePromoteToVerifie(reference.agentId);
        return { message: `Reference ${status.toLowerCase()}` };
    }
    async spotCheckFirstListing(agentId, passed) {
        await this.getAgentOrThrow(agentId);
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { firstListingChecked: passed },
        });
        if (passed)
            await this.maybePromoteToVerifie(agentId);
        return { message: passed ? "First listing spot-check passed" : "First listing spot-check failed" };
    }
    async maybePromoteToVerifie(agentId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { referencesReceived: true },
        });
        if (!agent || agent.verificationTier !== "NON_VERIFIE")
            return;
        const hasConfirmedReference = agent.referencesReceived.some((r) => r.status === "CONFIRMED");
        const ready = agent.idDocumentStatus === "APPROVED" && hasConfirmedReference && agent.firstListingChecked;
        if (!ready)
            return;
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { verificationTier: "VERIFIE", verifiedAt: new Date(), lastTierCheckedAt: new Date() },
        });
    }
    async setTier(agentId, tier) {
        const agent = await this.getAgentOrThrow(agentId);
        const data = { verificationTier: tier, lastTierCheckedAt: new Date() };
        if (tier === "VERIFIE" && !agent.verifiedAt)
            data.verifiedAt = new Date();
        if (tier === "PARTENAIRE_CONFIANCE" && !agent.partnerSince)
            data.partnerSince = new Date();
        await this.prisma.agent.update({ where: { id: agentId }, data });
        return { message: `Agent moved to ${tier}` };
    }
    async setFlagged(agentId, flagged) {
        await this.getAgentOrThrow(agentId);
        await this.prisma.agent.update({ where: { id: agentId }, data: { flagged } });
        return { message: flagged ? "Agent flagged for re-review" : "Flag cleared" };
    }
    async evaluateTierPromotions() {
        const cutoff = new Date(Date.now() - this.TIER3_MIN_DAYS * 24 * 60 * 60 * 1000);
        const candidates = await this.prisma.agent.findMany({
            where: {
                verificationTier: "VERIFIE",
                flagged: false,
                verifiedAt: { lte: cutoff },
                closedDeals: { gte: this.TIER3_MIN_DEALS },
            },
        });
        const promotedAgentIds = [];
        for (const agent of candidates) {
            const complaintRate = agent.closedDeals > 0 ? agent.complaintCount / agent.closedDeals : 0;
            if (complaintRate > this.TIER3_MAX_COMPLAINT_RATE)
                continue;
            await this.prisma.agent.update({
                where: { id: agent.id },
                data: {
                    verificationTier: "PARTENAIRE_CONFIANCE",
                    partnerSince: new Date(),
                    lastTierCheckedAt: new Date(),
                },
            });
            promotedAgentIds.push(agent.id);
        }
        await this.prisma.agent.updateMany({
            where: { verificationTier: "VERIFIE", id: { notIn: promotedAgentIds } },
            data: { lastTierCheckedAt: new Date() },
        });
        return { evaluated: candidates.length, promoted: promotedAgentIds.length, promotedAgentIds };
    }
    async submitBusinessProof(agencyId, tmpKey, requestingAgentId) {
        const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
        if (!agency)
            throw new common_1.NotFoundException("Agency not found");
        const requestingAgent = await this.getAgentOrThrow(requestingAgentId);
        if (requestingAgent.agencyId !== agencyId) {
            throw new common_1.BadRequestException("You are not on staff at this agency");
        }
        const key = await this.uploads.promoteToPrefix(tmpKey, `agencies/${agencyId}/business-proof`);
        await this.prisma.agency.update({ where: { id: agencyId }, data: { businessProofUrl: key } });
        return { message: "Business proof submitted for review" };
    }
    async approveAgency(agencyId) {
        const agency = await this.prisma.agency.findUnique({
            where: { id: agencyId },
            include: { agents: true },
        });
        if (!agency)
            throw new common_1.NotFoundException("Agency not found");
        const hasVerifiedStaff = agency.agents.some((a) => a.verificationTier !== "NON_VERIFIE");
        if (!hasVerifiedStaff) {
            throw new common_1.BadRequestException("Agency needs at least one already-verified agent on staff");
        }
        if (!agency.businessProofUrl) {
            throw new common_1.BadRequestException("Agency is missing business proof (e.g. RCCM)");
        }
        await this.prisma.agency.update({
            where: { id: agencyId },
            data: { verificationStatus: "APPROVED", approvedAt: new Date(), standingFlagged: false },
        });
        return { message: "Agency approved" };
    }
    async rejectAgency(agencyId) {
        const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
        if (!agency)
            throw new common_1.NotFoundException("Agency not found");
        await this.prisma.agency.update({
            where: { id: agencyId },
            data: { verificationStatus: "REJECTED" },
        });
        return { message: "Agency rejected" };
    }
    async fileComplaint(agentId, reporterUserId, dto) {
        const agent = await this.getAgentOrThrow(agentId);
        await this.prisma.agentComplaint.create({
            data: { agentId, reporterUserId, reason: dto.reason, details: dto.details },
        });
        const updated = await this.prisma.agent.update({
            where: { id: agentId },
            data: { complaintCount: { increment: 1 } },
        });
        if (updated.complaintCount >= this.FLAG_COMPLAINT_THRESHOLD && !updated.flagged) {
            await this.prisma.agent.update({ where: { id: agentId }, data: { flagged: true } });
            if (agent.agencyId) {
                await this.prisma.agency.update({
                    where: { id: agent.agencyId },
                    data: { standingFlagged: true },
                });
            }
        }
        return { message: "Complaint filed" };
    }
    async getAgentOrThrow(agentId) {
        const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent)
            throw new common_1.NotFoundException("Agent not found");
        return agent;
    }
};
exports.AgentVerificationService = AgentVerificationService;
exports.AgentVerificationService = AgentVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], AgentVerificationService);
//# sourceMappingURL=agent-verification.service.js.map