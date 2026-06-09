import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateReviewDto): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        rating: number;
        userId: string;
        agentId: string | null;
        propertyId: string | null;
        comment: string | null;
    }>;
    getMyReviews(userId: string): Promise<({
        agent: {
            id: string;
            name: string;
        } | null;
        property: {
            id: string;
            title: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        rating: number;
        userId: string;
        agentId: string | null;
        propertyId: string | null;
        comment: string | null;
    })[]>;
    getPropertyReviews(propertyId: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        rating: number;
        userId: string;
        agentId: string | null;
        propertyId: string | null;
        comment: string | null;
    })[]>;
    getAgentReviews(agentId: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        rating: number;
        userId: string;
        agentId: string | null;
        propertyId: string | null;
        comment: string | null;
    })[]>;
    delete(userId: string, id: string): Promise<{
        message: string;
    }>;
}
