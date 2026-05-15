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
    return this.prisma.agency.create({ data: dto });
  }

  async update(id: string, dto: UpdateAgencyDto) {
    await this.findOne(id);
    return this.prisma.agency.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agency.delete({ where: { id } });
    return { message: "Agency deleted" };
  }
}
