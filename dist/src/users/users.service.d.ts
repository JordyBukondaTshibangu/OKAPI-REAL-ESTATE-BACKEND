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
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    updateMe(userId: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    updateAvatar(userId: string, tmpKey: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    removeAvatar(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    deleteMe(userId: string): Promise<{
        message: string;
    }>;
}
