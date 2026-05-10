import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterAgentDto } from './dto/filter-agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll({ page, limit, name, specialization, language, nationality }: FilterAgentDto) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (language) where.languages = { has: language };
    if (nationality) where.nationality = { equals: nationality, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({ skip, take: limit, where, include: { agency: true, areasOfExpertise: true, trackRecord: true } }),
      this.prisma.agent.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id }, include: { agency: true, areasOfExpertise: true, trackRecord: true, properties: true } });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  create(dto: CreateAgentDto) {
    return this.prisma.agent.create({ data: dto });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    return this.prisma.agent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agent.delete({ where: { id } });
    return { message: 'Agent deleted' };
  }
}
