import { AgentVerificationService } from "./agent-verification.service";
export declare class AdminAgencyVerificationController {
    private verification;
    constructor(verification: AgentVerificationService);
    approve(agencyId: string): Promise<{
        message: string;
    }>;
    reject(agencyId: string): Promise<{
        message: string;
    }>;
}
