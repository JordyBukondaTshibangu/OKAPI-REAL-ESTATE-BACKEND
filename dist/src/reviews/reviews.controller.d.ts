import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsService } from "./reviews.service";
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    create(req: any, dto: CreateReviewDto): Promise<{
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
    getMyReviews(req: any): Promise<({
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
    delete(req: any, id: string): Promise<{
        message: string;
    }>;
}
