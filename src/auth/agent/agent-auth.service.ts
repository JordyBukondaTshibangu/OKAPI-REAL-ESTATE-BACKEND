import {
  BadRequestException,
  ConflictException,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { MailService } from "../../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";
import { SmsService } from "../../sms/sms.service";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";

@Injectable()
export class AgentAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private sms: SmsService,
  ) {}

  /**
   * Tier 1 (Non-vérifié): self-signup with phone/WhatsApp + password.
   * No admin review at this point — the agent can draft listings and build
   * a profile, but stays invisible in public search until promoted.
   */
  async register(dto: RegisterAgentDto) {
    const existingPhone = await this.prisma.agent.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) throw new ConflictException("Phone number already in use");

    if (dto.email) {
      const existingEmail = await this.prisma.agent.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) throw new ConflictException("Email already in use");
    }

    if (dto.agencyId) {
      const agency = await this.prisma.agency.findUnique({
        where: { id: dto.agencyId },
      });
      if (!agency) throw new BadRequestException("Agency not found");
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
        // verificationTier defaults to NON_VERIFIE via the schema default.
      },
    });

    return {
      access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
      agent: { id: agent.id, name: agent.name, verificationTier: agent.verificationTier },
    };
  }

  async login(dto: LoginAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ email: dto.identifier }, { phoneNumber: dto.identifier }] },
    });
    if (!agent || !agent.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(dto.password, agent.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    return {
      access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
      agent: { id: agent.id, name: agent.name, verificationTier: agent.verificationTier },
    };
  }

  // ---------------------------------------------------------------------------
  // Phone OTP verification
  // ---------------------------------------------------------------------------

  /**
   * Generates a 6-digit OTP, stores it (with a 10-minute expiry) on the agent
   * record, and fires an SMS to their registered phone number.
   *
   * Rate-limited to once every 60 seconds by the controller-level throttler.
   * Returns success regardless of current verificationTier so callers can
   * request a re-send if the first SMS was lost.
   */
  async sendOtp(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { phoneNumber: true, phoneOtpExpiry: true },
    });
    if (!agent) throw new UnauthorizedException("Agent not found");

    // Prevent OTP spam: block re-sends if the existing code is still fresh (< 60 s old)
    if (agent.phoneOtpExpiry) {
      const expiresAt = agent.phoneOtpExpiry.getTime();
      const now = Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;
      const ageMs = TEN_MINUTES - (expiresAt - now);
      if (ageMs < 60_000) {
        throw new TooManyRequestsException("Please wait 60 seconds before requesting a new code");
      }
    }

    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { phoneOtpCode: code, phoneOtpExpiry: expiry },
    });

    await this.sms.sendOtp(agent.phoneNumber, code);
    return { message: "OTP sent to your registered phone number" };
  }

  /**
   * Validates the OTP and, on success, upgrades the agent to VERIFIE tier.
   * The code is consumed (cleared) after a single successful use.
   */
  async verifyPhone(agentId: string, code: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { phoneOtpCode: true, phoneOtpExpiry: true, verificationTier: true },
    });
    if (!agent) throw new UnauthorizedException("Agent not found");

    if (
      !agent.phoneOtpCode ||
      !agent.phoneOtpExpiry ||
      agent.phoneOtpExpiry < new Date()
    ) {
      throw new BadRequestException("OTP expired or not requested — please request a new code");
    }

    if (agent.phoneOtpCode !== code) {
      throw new BadRequestException("Invalid OTP");
    }

    // Consume the OTP and upgrade the tier
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        phoneOtpCode: null,
        phoneOtpExpiry: null,
        verificationTier: "VERIFIE",
        verifiedAt: new Date(),
      },
    });

    return { message: "Phone verified — your account is now active", verificationTier: "VERIFIE" };
  }

  async forgotPassword(dto: ForgotPasswordAgentDto) {
    const agent = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent email enumeration
    if (!agent) return { message: "If that email exists, a reset link was sent" };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await this.mail.sendPasswordReset(agent.email!, token);
    return { message: "If that email exists, a reset link was sent" };
  }

  async resetPassword(dto: ResetPasswordAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!agent) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: "Password reset successful" };
  }
}
