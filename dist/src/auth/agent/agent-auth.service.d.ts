import { JwtService } from "@nestjs/jwt";
import { MailService } from "../../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";
export declare class AgentAuthService {
    private prisma;
    private jwt;
    private mail;
    constructor(prisma: PrismaService, jwt: JwtService, mail: MailService);
    register(dto: RegisterAgentDto): Promise<{
        access_token: string;
        agent: {
            id: string;
            name: string;
            verificationTier: import("@prisma/client").$Enums.AgentVerificationTier;
        };
    }>;
    login(dto: LoginAgentDto): Promise<{
        access_token: string;
        agent: {
            id: string;
            name: string;
            verificationTier: import("@prisma/client").$Enums.AgentVerificationTier;
        };
    }>;
    forgotPassword(dto: ForgotPasswordAgentDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordAgentDto): Promise<{
        message: string;
    }>;
}
