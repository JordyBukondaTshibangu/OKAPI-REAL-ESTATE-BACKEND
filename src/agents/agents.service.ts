import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toR2Url, UploadsService } from "../uploads/uploads.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { FilterAgentDto } from "./dto/filter-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  private resolvePhotoUrl(key: string): string {
    if (key.startsWith("http")) return key;
    return toR2Url(key);
  }

  private withPhotoUrl<T extends { photo: string }>(agent: T): T {
    return { ...agent, photo: this.resolvePhotoUrl(agent.photo) };
  }

  async findAll({
    page,
    limit,
    search,
    name,
    title,
    specialization,
    language,
    nationality,
    sortBy,
    sortOrder,
  }: FilterAgentDto) {
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { nationality: { contains: search, mode: "insensitive" } },
      ];
    }
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (title) where.title = { contains: title, mode: "insensitive" };
    if (specialization)
      where.specialization = { contains: specialization, mode: "insensitive" };
    if (language) where.languages = { has: language };
    if (nationality)
      where.nationality = { equals: nationality, mode: "insensitive" };

    const orderBy =
      sortBy === "agency"
        ? { agency: { name: order } }
        : sortBy
          ? { [sortBy]: order }
          : { createdAt: "desc" as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: { agency: true, areasOfExpertise: true, trackRecord: true },
      }),
      this.prisma.agent.count({ where }),
    ]);
    return {
      data: data.map((agent) => this.withPhotoUrl(agent)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        agency: true,
        areasOfExpertise: true,
        trackRecord: true,
        properties: true,
      },
    });
    if (!agent) throw new NotFoundException("Agent not found");
    return this.withPhotoUrl(agent);
  }

  async create(dto: CreateAgentDto) {
    const agent = await this.prisma.agent.create({ data: dto });
    return this.withPhotoUrl(agent);
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    const agent = await this.prisma.agent.update({ where: { id }, data: dto });
    return this.withPhotoUrl(agent);
  }

  async updatePhoto(id: string, tmpKey: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: { photo: true },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    if (agent.photo && !agent.photo.startsWith("http")) {
      await this.uploads.deleteKey(agent.photo).catch(() => {});
    }

    const newKey = await this.uploads.promoteToPrefix(tmpKey, `agents/${id}`);
    const updated = await this.prisma.agent.update({
      where: { id },
      data: { photo: newKey },
      include: { agency: true, areasOfExpertise: true, trackRecord: true },
    });
    return this.withPhotoUrl(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agent.delete({ where: { id } });
    return { message: "Agent deleted" };
  }
}
