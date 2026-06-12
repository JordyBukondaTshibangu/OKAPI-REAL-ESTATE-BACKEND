import { PrismaService } from "../prisma/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { UpdateUserDto } from "./dto/update-user.dto";
export declare class UsersService {
    private prisma;
    private uploads;
    constructor(prisma: PrismaService, uploads: UploadsService);
    private resolveAvatarUrl;
    private withAvatarUrl;
    findMe(userId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    updateMe(userId: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    updateAvatar(userId: string, tmpKey: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    removeAvatar(userId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    deleteMe(userId: string): Promise<{
        message: string;
    }>;
}
