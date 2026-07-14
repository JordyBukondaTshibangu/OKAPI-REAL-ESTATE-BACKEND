import { Injectable, Logger } from "@nestjs/common";

/**
 * Thin wrapper around Twilio SMS.
 *
 * Requires these env vars to actually send messages:
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx   (or a Twilio Messaging Service SID)
 *
 * If any of those are absent the service falls back to logging the OTP to the
 * console — handy for local development without a Twilio account.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly ready: boolean;

  constructor() {
    this.ready = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER,
    );

    if (!this.ready) {
      this.logger.warn(
        "Twilio env vars not set — SMS will be logged to console only. " +
          "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable real SMS.",
      );
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.ready) {
      // Dev fallback: print OTP so the developer can use it manually.
      this.logger.log(`[DEV SMS] To: ${to} | ${body}`);
      return;
    }

    // Lazy-require twilio so the app boots fine even without the package
    // installed (dev mode without SMS).
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${to}`, err);
      throw err;
    }
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const body = `Your Okapi verification code is ${code}. It expires in 10 minutes. Do not share it.`;
    return this.sendSms(phoneNumber, body);
  }
}
