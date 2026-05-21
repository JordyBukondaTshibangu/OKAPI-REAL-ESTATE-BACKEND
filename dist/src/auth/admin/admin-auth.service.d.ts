import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
export declare class AdminAuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(dto: AdminLoginDto): Promise<{
        access_token: string;
    }>;
}
