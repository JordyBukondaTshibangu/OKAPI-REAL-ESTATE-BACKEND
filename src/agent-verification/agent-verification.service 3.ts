import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AgentVerificationTier, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { FileComplaintDto } from "./dto/file-complaint.dto";
import { RequestReferenceDto } from "./dto/request-reference.dto";

/**
 * Implements the tiered trust model:
 *   Tier 1 Non-vérifié -> Tier 2 Vérifié  (manual, ops team, async)
 *   Tier 2 Vérifié     -> Tier 3 Partenaire de confiance (automated, metrics-driven)
 *
 * "Vouches" (AgentReference) and agency verification status are kept as
 * internal scoring signals only — never surfaced in public API responses.
 */
@Injectable()
export class AgentVerificationService {
  private readonly TIER3_MIN_DAYS = 90;
  private readonly TIER3_MIN_DEALS = 10;
  private readonly TIER3_MAX_COMPLAINT_RATE = 0.05;
  private readonly FLAG_COMPLAINT_THRESHOLD = 3;

  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  // ---------------------------------------------------------------------
  // Agent self-service (Tier 1 -> Tier 2 inputs)
  // ---------------------------------------------------------------------

  async submitIdDocument(agentId: string, tmpKey: string) {
    await this.getAgentOrThrow(agentId);
    const key = await this.uploads.promoteToPrefix(tmpKey, `agents/${agentId}/id-document`);
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { idDocumentUrl: key, idDocumentStatus: "PENDING" },
    });
    return { message: "ID document submitted for review" };
  }

  async requestReference(agentId: string, dto: RequestReferenceDto) {
    await this.getAgentOrThrow(agentId);

    if (dto.type === "AGENT") {
      if (!dto.voucherAgentId) {
        throw new BadRequestException("voucherAgentId is required for an AGENT reference");
      }
      const voucher = await this.prisma.agent.findUnique({ where: { id: dto.voucherAgentId } });
      if (!voucher) throw new BadRequestException("Voucher agent not found");
      if (voucher.verificationTier === "NON_VERIFIE") {
        throw new BadRequestException("The voucher must already be a verified agent");
      }
    }

    let voucherAgency: { verificationStatus: string } | null = null;
    if (dto.type === "AGENCY") {
      if (!dto.voucherAgencyId) {
        throw new BadRequestException("voucherAgencyId is required for an AGENCY reference");
      }
      voucherAgency = await this.prisma.agency.findUnique({ where: { id: dto.voucherAgencyId } });
      if (!voucherAgency) throw new BadRequestException("Voucher agency not found");
    }

    // An already-approved agency vouching for its own staff *is* the trust
    // structure — fast-track it instead of waiting on async admin review.
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

    if (isAgencyFastTrack) await this.maybePromoteToVerifie(agentId);
    return reference;
  }

  // ---------------------------------------------------------------------
  // Admin review queue (Tier 1 -> Tier 2)
  // ---------------------------------------------------------------------

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

  async getAgentDetail(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { agency: true, referencesReceived: true, complaints: true },
    });
    if (!agent) throw new NotFoundException("Agent not found");
    return agent;
  }

  async reviewIdDocument(agentId: string, status: "APPROVED" | "REJECTED") {
    await this.getAgentOrThrow(agentId);
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { idDocumentStatus: status },
    });
    if (status === "APPROVED") await this.maybePromoteToVerifie(agentId);
    return { message: `ID document ${status.toLowerCase()}` };
  }

  async reviewReference(
    referenceId: string,
    status: "CONFIRMED" | "REVOKED" | "FLAGGED",
    note?: string,
  ) {
    const reference = await this.prisma.agentReference.findUnique({ where: { id: referenceId } });
    if (!reference) throw new NotFoundException("Reference not found");

    await this.prisma.agentReference.update({
      where: { id: referenceId },
      data: { status, note, reviewedAt: new Date() },
    });

    if (status === "FLAGGED") {
      // A vouch that turns out to be fraudulent is a flag on both accounts.
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

    if (status === "CONFIRMED") await this.maybePromoteToVerifie(reference.agentId);
    return { message: `Reference ${status.toLowerCase()}` };
  }

  async spotCheckFirstListing(agentId: string, passed: boolean) {
    await this.getAgentOrThrow(agentId);
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { firstListingChecked: passed },
    });
    if (passed) await this.maybePromoteToVerifie(agentId);
    return { message: passed ? "First listing spot-check passed" : "First listing spot-check failed" };
  }

  /** Promotes Non-vérifié -> Vérifié once all three conditions are met. */
  private async maybePromoteToVerifie(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { referencesReceived: true },
    });
    if (!agent || agent.verificationTier !== "NON_VERIFIE") return;

    const hasConfirmedReference = agent.referencesReceived.some((r) => r.status === "CONFIRMED");
    const ready = agent.idDocumentStatus === "APPROVED" && hasConfirmedReference && agent.firstListingChecked;
    if (!ready) return;

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { verificationTier: "VERIFIE", verifiedAt: new Date(), lastTierCheckedAt: new Date() },
    });
  }

  /** Manual override — re-review resolution, demotion, or correcting a mistake. */
  async setTier(agentId: string, tier: AgentVerificationTier) {
    const agent = await this.getAgentOrThrow(agentId);
    const data: Prisma.AgentUpdateInput = { verificationTier: tier, lastTierCheckedAt: new Date() };
    if (tier === "VERIFIE" && !agent.verifiedAt) data.verifiedAt = new Date();
    if (tier === "PARTENAIRE_CONFIANCE" && !agent.partnerSince) data.partnerSince = new Date();
    await this.prisma.agent.update({ where: { id: agentId }, data });
    return { message: `Agent moved to ${tier}` };
  }

  async setFlagged(agentId: string, flagged: boolean) {
    await this.getAgentOrThrow(agentId);
    await this.prisma.agent.update({ where: { id: agentId }, data: { flagged } });
    return { message: flagged ? "Agent flagged for re-review" : "Flag cleared" };
  }

  // ---------------------------------------------------------------------
  // Tier 2 -> Tier 3: automated, metrics-driven, no manual review.
  // No scheduler is wired up here (the project has no cron dependency yet);
  // call this from an admin endpoint or hook it up to a scheduled task.
  // ---------------------------------------------------------------------

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

    const promotedAgentIds: string[] = [];
    for (const agent of candidates) {
      const complaintRate = agent.closedDeals > 0 ? agent.complaintCount / agent.closedDeals : 0;
      if (complaintRate > this.TIER3_MAX_COMPLAINT_RATE) continue;

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

  // ---------------------------------------------------------------------
  // Agency verification gate (heavier — vouches for many agents at once)
  // ---------------------------------------------------------------------

  async submitBusinessProof(agencyId: string, tmpKey: string, requestingAgentId: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException("Agency not found");

    const requestingAgent = await this.getAgentOrThrow(requestingAgentId);
    if (requestingAgent.agencyId !== agencyId) {
      throw new BadRequestException("You are not on staff at this agency");
    }

    const key = await this.uploads.promoteToPrefix(tmpKey, `agencies/${agencyId}/business-proof`);
    await this.prisma.agency.update({ where: { id: agencyId }, data: { businessProofUrl: key } });
    return { message: "Business proof submitted for review" };
  }

  async approveAgency(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { agents: true },
    });
    if (!agency) throw new NotFoundException("Agency not found");

    const hasVerifiedStaff = agency.agents.some((a) => a.verificationTier !== "NON_VERIFIE");
    if (!hasVerifiedStaff) {
      throw new BadRequestException("Agency needs at least one already-verified agent on staff");
    }
    if (!agency.businessProofUrl) {
      throw new BadRequestException("Agency is missing business proof (e.g. RCCM)");
    }

    await this.prisma.agency.update({
      where: { id: agencyId },
      data: { verificationStatus: "APPROVED", approvedAt: new Date(), standingFlagged: false },
    });
    return { message: "Agency approved" };
  }

  async rejectAgency(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException("Agency not found");
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: { verificationStatus: "REJECTED" },
    });
    return { message: "Agency rejected" };
  }

  // Agency staff fast-track via requestReference({ type: "AGENCY", voucherAgencyId })
  // — an approved agency vouching for its own staff auto-confirms there,
  // skipping the external-reference wait. See requestReference() above.

  // ---------------------------------------------------------------------
  // Complaints — suspicion-triggered re-review, the only ongoing manual workload.
  // ---------------------------------------------------------------------

  async fileComplaint(agentId: string, reporterUserId: string, dto: FileComplaintDto) {
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

  private async getAgentOrThrow(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent not found");
    return agent;
  }
}
