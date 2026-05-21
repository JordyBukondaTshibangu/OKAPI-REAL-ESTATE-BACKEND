import { PrismaService } from "../prisma/prisma.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
export declare class EnquiriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateEnquiryDto): Promise<{
        property: {
            id: string;
            title: string;
            city: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
        message: string;
        status: string;
    }>;
    getMyEnquiries(userId: string): Promise<({
        property: {
            id: string;
            title: string;
            city: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
        message: string;
        status: string;
    })[]>;
    getEnquiriesForProperty(propertyId: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
        message: string;
        status: string;
    })[]>;
    delete(userId: string, id: string): Promise<{
        message: string;
    }>;
}
