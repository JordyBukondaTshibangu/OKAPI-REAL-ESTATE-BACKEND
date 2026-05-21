import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    updateMe(req: any, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    removeAvatar(req: any): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string | null;
    }>;
    deleteMe(req: any): Promise<{
        message: string;
    }>;
}
