import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";
export declare class FavoritesController {
    private favoritesService;
    constructor(favoritesService: FavoritesService);
    add(req: any, dto: CreateFavoriteDto): Promise<{
        property: {
            transaction: string | null;
            id: string;
            createdAt: Date;
            description: string | null;
            title: string;
            brokerLicense: string | null;
            agencyId: string;
            bedrooms: number;
            period: string | null;
            availableFrom: string | null;
            listingType: string;
            category: string;
            price: number;
            currency: string;
            subtitle: string;
            bathrooms: number;
            areaSqm: number;
            suburb: string;
            neighborhood: string;
            city: string;
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
            averagePriceArea: number | null;
            averageSizeArea: number | null;
            agentId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
    }>;
    remove(req: any, propertyId: string): Promise<{
        message: string;
    }>;
    getAll(req: any): Promise<({
        property: {
            transaction: string | null;
            id: string;
            createdAt: Date;
            description: string | null;
            title: string;
            brokerLicense: string | null;
            agencyId: string;
            bedrooms: number;
            period: string | null;
            availableFrom: string | null;
            listingType: string;
            category: string;
            price: number;
            currency: string;
            subtitle: string;
            bathrooms: number;
            areaSqm: number;
            suburb: string;
            neighborhood: string;
            city: string;
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
            averagePriceArea: number | null;
            averageSizeArea: number | null;
            agentId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        propertyId: string;
    })[]>;
}
