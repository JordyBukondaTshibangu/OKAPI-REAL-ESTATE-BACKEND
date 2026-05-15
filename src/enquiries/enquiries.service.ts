import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";

@Injectable()
export class EnquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEnquiryDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException("Property not found");

    return this.prisma.enquiry.create({
      data: { userId, propertyId: dto.propertyId, message: dto.message },
      include: { property: { select: { id: true, title: true, city: true } } },
    });
  }

  async getMyEnquiries(userId: string) {
    return this.prisma.enquiry.findMany({
      where: { userId },
      include: { property: { select: { id: true, title: true, city: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEnquiriesForProperty(propertyId: string) {
    return this.prisma.enquiry.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(userId: string, id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry || enquiry.userId !== userId)
      throw new NotFoundException("Enquiry not found");
    await this.prisma.enquiry.delete({ where: { id } });
    return { message: "Enquiry deleted" };
  }
}
