import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { MailService } from "../../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CompleteAgentProfileDto } from "./dto/complete-agent-profile.dto";
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
  ) {}

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Self-signup: creates an agent at NON_VERIFIE tier, immediately sends a
   * 6-digit OTP to their email, and returns a JWT.
   *
   * The agent stays invisible in public search (NON_VERIFIE is filtered out)
   * until:
   *   1. They verify their email via POST /auth/agent/verify-email
   *   2. An admin reviews the profile and calls PATCH /agents/:id/approve
   */
  async register(dto: RegisterAgentDto) {
    // Uniqueness checks
    const existingEmail = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) throw new ConflictException("Email already in use");

    const existingPhone = await this.prisma.agent.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) throw new ConflictException("Phone number already in use");

    if (dto.agencyId) {
      const agency = await this.prisma.agency.findUnique({ where: { id: dto.agencyId } });
      if (!agency) throw new BadRequestException("Agency not found");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { code, expiry } = this.generateOtp();

    const agent = await this.prisma.agent.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        whatsappNumber: dto.whatsappNumber,
        passwordHash,
        agencyId: dto.agencyId,
        emailOtpCode: code,
        emailOtpExpiry: expiry,
        // verificationTier defaults to NON_VERIFIE — remains so until admin approves.
      },
    });

    // Await in dev so SMTP errors surface immediately in the terminal.
    // In production you may want to fire-and-forget once SMTP is confirmed working.
    await this.mail.sendAgentEmailOtp(agent.email!, agent.name, code);

    return {
      access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        verificationTier: agent.verificationTier,
        emailVerified: agent.emailVerified,
      },
      message: "Account created — check your email for a verification code.",
    };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  async login(dto: LoginAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { OR: [{ email: dto.identifier }, { phoneNumber: dto.identifier }] },
    });
    if (!agent || !agent.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const valid = await bcrypt.compare(dto.password, agent.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = agent as any;
    return {
      access_token: this.jwt.sign({ sub: agent.id, role: "agent" }),
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        verificationTier: agent.verificationTier,
        emailVerified: agent.emailVerified,
        agentType: a.agentType ?? null,
        agencyId: a.agencyId ?? null,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Email OTP verification
  // ---------------------------------------------------------------------------

  /**
   * Re-sends the 6-digit OTP to the agent's email.
   * Rate-limited: at most one code per 60 seconds.
   */
  async resendVerificationEmail(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { email: true, name: true, emailVerified: true, emailOtpExpiry: true },
    });
    if (!agent) throw new UnauthorizedException("Agent not found");
    if (agent.emailVerified) {
      return { message: "Email is already verified — waiting for admin approval." };
    }

    // Prevent spam: block if the existing code is less than 60 s old
    if (agent.emailOtpExpiry) {
      const ageMs = 10 * 60 * 1000 - (agent.emailOtpExpiry.getTime() - Date.now());
      if (ageMs < 60_000) {
        throw new HttpException(
          "Please wait 60 seconds before requesting a new code",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const { code, expiry } = this.generateOtp();
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { emailOtpCode: code, emailOtpExpiry: expiry },
    });

    await this.mail.sendAgentEmailOtp(agent.email!, agent.name, code);
    return { message: "Verification code resent — check your email." };
  }

  /**
   * Validates the emailed OTP.
   * On success: marks emailVerified = true (tier stays NON_VERIFIE) and
   * fires an admin notification so a human can review and approve.
   */
  async verifyEmail(agentId: string, code: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        emailOtpCode: true,
        emailOtpExpiry: true,
      },
    });
    if (!agent) throw new UnauthorizedException("Agent not found");

    if (agent.emailVerified) {
      return {
        message: "Email already verified — your profile is under admin review.",
        emailVerified: true,
      };
    }

    if (
      !agent.emailOtpCode ||
      !agent.emailOtpExpiry ||
      agent.emailOtpExpiry < new Date()
    ) {
      throw new BadRequestException(
        "OTP expired or not requested — please request a new code.",
      );
    }

    if (agent.emailOtpCode !== code) {
      throw new BadRequestException("Invalid OTP.");
    }

    // Consume the OTP and mark email as verified.
    // verificationTier intentionally stays NON_VERIFIE — admin must approve.
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { emailOtpCode: null, emailOtpExpiry: null, emailVerified: true },
    });

    // Notify admin in the background — don't block the response.
    this.mail
      .sendAdminAgentPendingApproval({
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email!,
        agentPhone: agent.phoneNumber,
      })
      .catch(() => {});

    return {
      message:
        "Email verified! Your profile is now under review. " +
        "You will be notified once an admin approves your account.",
      emailVerified: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 2: Complete professional profile (after email verification)
  // ---------------------------------------------------------------------------

  /**
   * Saves the professional profile data collected in Step 2 of self-signup.
   * Can be called any time after registration (the agent may finish later).
   */
  async completeProfile(agentId: string, dto: CompleteAgentProfileDto) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new UnauthorizedException("Agent not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        agentType:            dto.agentType,
        whatsappNumber:       dto.whatsapp ?? agent.phoneNumber, // default to phone
        agencyId:             dto.agencyId ?? (agent as any).agencyId,
        communes:             dto.communes,
        propertyTypes:        dto.propertyTypes,
        rentalFocus:          dto.rentalFocus,
        yearsExperienceLabel: dto.yearsExperienceLabel,
        idDocumentUrl:        dto.idDocumentUrl,
        referredById:         dto.referredById,
        bio:                  dto.bio ?? agent.bio,
        photo:                dto.photo ?? agent.photo,
      } as any,
    });

    return { message: "Profile updated successfully." };
  }

  // ---------------------------------------------------------------------------
  // Password reset
  // ---------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordAgentDto) {
    const agent = await this.prisma.agent.findUnique({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!agent) return { message: "If that email exists, a reset link was sent" };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await this.mail.sendPasswordReset(agent.email!, token, agent.name.split(" ")[0]);
    return { message: "If that email exists, a reset link was sent" };
  }

  async resetPassword(dto: ResetPasswordAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { resetToken: dto.token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!agent) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: "Password reset successful" };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private generateOtp(): { code: string; expiry: Date } {
    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { code, expiry };
  }
}
