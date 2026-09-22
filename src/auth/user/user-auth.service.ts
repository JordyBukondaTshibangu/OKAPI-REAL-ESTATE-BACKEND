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
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import type { GoogleUserProfile } from "../strategies/google-user.strategy";

@Injectable()
export class UserAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Email already in use");
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        passwordHash,
      },
    });
    void this.mail.sendWelcome(user.email, user.firstName);
    const {
      passwordHash: _ph,
      resetToken: _rt,
      resetTokenExpiry: _rte,
      ...safeUser
    } = user;
    return {
      access_token: this.jwt.sign({ sub: user.id, role: "user" }),
      user: safeUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "Ce compte utilise Google Sign-In — veuillez vous connecter avec Google.",
      );
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");
    return { access_token: this.jwt.sign({ sub: user.id, role: "user" }) };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async googleLogin(profile: GoogleUserProfile) {
    return this.findOrCreateGoogleUser(profile);
  }

  private async findOrCreateGoogleUser(profile: GoogleUserProfile) {
    // 1. Try to find by googleId
    let user = await (this.prisma.user as any).findUnique({
      where: { googleId: profile.googleId },
    });

    // 2. Try to find by email and link the Google account
    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (user) {
        user = await (this.prisma.user as any).update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            // Use Google photo if no profile image set
            ...(user.profileImage ? {} : { profileImage: profile.photo }),
          },
        });
      }
    }

    // 3. Create a new user
    if (!user) {
      if (!profile.email) {
        throw new BadRequestException(
          "Google account has no email address — cannot create a user account",
        );
      }
      user = await (this.prisma.user as any).create({
        data: {
          googleId:     profile.googleId,
          firstName:    profile.firstName,
          lastName:     profile.lastName || profile.firstName,
          email:        profile.email,
          profileImage: profile.photo,
          // passwordHash intentionally null — Google-only account
          // phoneNumber intentionally null — not provided by Google
        },
      });
      void this.mail.sendWelcome(user.email, user.firstName);
    }

    const { passwordHash: _ph, resetToken: _rt, resetTokenExpiry: _rte, ...safeUser } = user;
    return {
      access_token: this.jwt.sign({ sub: user.id, role: "user" }),
      user: safeUser,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent email enumeration
    if (!user) return { message: "If that email exists, a reset link was sent" };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await this.mail.sendPasswordReset(user.email, token, user.firstName);
    return { message: "If that email exists, a reset link was sent" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: "Password reset successful" };
  }
}
