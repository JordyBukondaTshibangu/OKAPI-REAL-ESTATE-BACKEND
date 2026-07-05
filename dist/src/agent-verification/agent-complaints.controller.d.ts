import { AgentVerificationService } from "./agent-verification.service";
import { FileComplaintDto } from "./dto/file-complaint.dto";
interface UserRequest {
    user: {
        userId: string;
        role: string;
    };
}
export declare class AgentComplaintsController {
    private verification;
    constructor(verification: AgentVerificationService);
    fileComplaint(agentId: string, req: UserRequest, dto: FileComplaintDto): Promise<{
        message: string;
    }>;
}
export {};
