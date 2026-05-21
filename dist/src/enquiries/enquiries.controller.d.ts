import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { EnquiriesService } from "./enquiries.service";
export declare class EnquiriesController {
    private enquiriesService;
    constructor(enquiriesService: EnquiriesService);
    create(req: any, dto: CreateEnquiryDto): Promise<{
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
    getAll(req: any): Promise<({
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
    getForProperty(propertyId: string): Promise<({
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
    delete(req: any, id: string): Promise<{
        message: string;
    }>;
}
