export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendPasswordReset(email: string, token: string): Promise<void>;
}
