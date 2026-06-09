import { PrismaService } from "../prisma/prisma.service";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    addFavorite(userId: string, dto: CreateFavoriteDto): Promise<{
        property: {
            transaction: string | null;
            id: string;
            createdAt: Date;
            description: string | null;
            agencyId: string;
            title: string;
            brokerLicense: string | null;
            listingType: string;
            category: string;
            city: string;
            suburb: string;
            agentId: string;
            price: number;
            currency: string;
            period: string | null;
            subtitle: string;
            bedrooms: number;
            bathrooms: number;
            areaSqm: number;
            neighborhood: string;
            verified: boolean;
            premium: boolean;
            isNew: boolean;
            listedDaysAgo: number;
            imageGradient: string;
            iconType: string;
            gallery: string[];
            amenities: string[];
            reference: string | null;
            zone: string | null;
            agentLicense: string | null;
            permitNumber: string | null;
            availableFrom: string | null;
            averagePriceArea: number | null;
            averageSizeArea: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
    }>;
    removeFavorite(userId: string, propertyId: string): Promise<{
        message: string;
    }>;
    getMyFavorites(userId: string): Promise<({
        property: {
            transaction: string | null;
            id: string;
            createdAt: Date;
            description: string | null;
            agencyId: string;
            title: string;
            brokerLicense: string | null;
            listingType: string;
            category: string;
            city: string;
            suburb: string;
            agentId: string;
            price: number;
            currency: string;
            period: string | null;
            subtitle: string;
            bedrooms: number;
            bathrooms: number;
            areaSqm: number;
            neighborhood: string;
            verified: boolean;
            premium: boolean;
            isNew: boolean;
            listedDaysAgo: number;
            imageGradient: string;
            iconType: string;
            gallery: string[];
            amenities: string[];
            reference: string | null;
            zone: string | null;
            agentLicense: string | null;
            permitNumber: string | null;
            availableFrom: string | null;
            averagePriceArea: number | null;
            averageSizeArea: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
    })[]>;
}
