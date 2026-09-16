import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [properties, agents, agencies, users] = await Promise.all([
      this.prisma.property.count({ where: { status: "LIVE" } }),
      this.prisma.agent.count({ where: { verifiedAt: { not: null } } }),
      this.prisma.agency.count({ where: { verificationStatus: "APPROVED" } }),
      this.prisma.user.count(),
    ]);
    return { properties, agents, agencies, users };
  }
}
