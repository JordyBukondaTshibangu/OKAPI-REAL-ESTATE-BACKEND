import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAgencyDto } from "./dto/create-agency.dto";
import { FilterAgencyDto } from "./dto/filter-agency.dto";
import { UpdateAgencyDto } from "./dto/update-agency.dto";

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    page,
    limit,
    search,
    name,
    language,
    sortBy,
    sortOrder,
  }: FilterAgencyDto) {
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (language) where.languages = { has: language };

    const orderBy = sortBy
      ? { [sortBy]: order }
      : { createdAt: "desc" as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.agency.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: { agents: true },
      }),
      this.prisma.agency.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: { agents: true, properties: true },
    });
    if (!agency) throw new NotFoundException("Agency not found");
    return agency;
  }

  create(dto: CreateAgencyDto) {
    // Agencies created directly by Admin are pre-vetted out of band, same
    // reasoning as Agent.create() — they don't need to go through the
    // self-service business-proof gate built for agency self-registration.
    //
    // Strip undefined values before spreading into Prisma — optional DTO fields
    // are typed as `string | undefined` but Prisma optional string fields expect
    // `string | null`. Omitting the key entirely satisfies both.
    const payload = {
      ...dto,
      verificationStatus: "APPROVED" as const,
      approvedAt: new Date(),
      // Convert date-only string (e.g. "2026-10-29") to a full Date object
      gracePeriodEndsAt: dto.gracePeriodEndsAt ? new Date(dto.gracePeriodEndsAt) : undefined,
    };
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ) as unknown as Parameters<typeof this.prisma.agency.create>[0]["data"];

    return this.prisma.agency.create({ data: clean });
  }

  async update(id: string, dto: UpdateAgencyDto) {
    await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      ...dto,
      gracePeriodEndsAt: (dto as any).gracePeriodEndsAt
        ? new Date((dto as any).gracePeriodEndsAt)
        : undefined,
    };
    return this.prisma.agency.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agency.delete({ where: { id } });
    return { message: "Agency deleted" };
  }
}
