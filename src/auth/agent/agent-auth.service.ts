import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { MailService } from "../../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";
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

    await this.mail.sendPasswordReset(agent.email!, token, agent.name.split(" ")[0]);
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
