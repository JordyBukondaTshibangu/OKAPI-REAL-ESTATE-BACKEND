import { AgentVerificationService } from "./agent-verification.service";
import { RequestReferenceDto } from "./dto/request-reference.dto";
import { SubmitIdDocumentDto } from "./dto/submit-id-document.dto";
interface AgentRequest {
    user: {
        agentId: string;
        role: string;
    };
}
export declare class AgentSelfServiceController {
    private verification;
    constructor(verification: AgentVerificationService);
    submitIdDocument(req: AgentRequest, dto: SubmitIdDocumentDto): Promise<{
        message: string;
    }>;
    requestReference(req: AgentRequest, dto: RequestReferenceDto): Promise<{
        id: string;
        createdAt: Date;
        agentId: string;
        type: import("@prisma/client").$Enums.ReferenceType;
        voucherAgentId: string | null;
        voucherAgencyId: string | null;
        voucherName: string | null;
        voucherContact: string | null;
        note: string | null;
        status: import("@prisma/client").$Enums.ReferenceStatus;
        reviewedAt: Date | null;
    }>;
}
export {};
