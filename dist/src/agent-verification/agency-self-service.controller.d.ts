import { AgentVerificationService } from "./agent-verification.service";
import { SubmitBusinessProofDto } from "./dto/submit-business-proof.dto";
interface AgentRequest {
    user: {
        agentId: string;
        role: string;
    };
}
export declare class AgencySelfServiceController {
    private verification;
    constructor(verification: AgentVerificationService);
    submitBusinessProof(agencyId: string, req: AgentRequest, dto: SubmitBusinessProofDto): Promise<{
        message: string;
    }>;
}
export {};
