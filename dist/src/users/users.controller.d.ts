import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    updateMe(req: any, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    updateAvatar(req: any, dto: UpdateAvatarDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    removeAvatar(req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
        createdAt: Date;
    }>;
    deleteMe(req: any): Promise<{
        message: string;
    }>;
}
