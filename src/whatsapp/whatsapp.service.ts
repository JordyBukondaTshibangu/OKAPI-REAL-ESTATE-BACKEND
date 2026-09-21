import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

/**
 * WhatsApp Business Cloud API (Meta Graph API v20.0)
 *
 * Required env vars:
 *   WHATSAPP_TOKEN          — Permanent token from Meta System User
 *   WHATSAPP_PHONE_NUMBER_ID — Phone Number ID (not the phone number itself)
 *
 * Optional:
 *   WHATSAPP_OTP_TEMPLATE  — Template name for OTP (default: "agent_otp")
 *   WHATSAPP_OTP_LANGUAGE  — Template language code (default: "fr")
 *
 * ─── Template to create in Meta Business Manager ──────────────────────────
 * Name      : agent_otp  (or whatever WHATSAPP_OTP_TEMPLATE is set to)
 * Category  : UTILITY
 * Language  : French (fr)
 * Body text :
 *   Bonjour {{1}}, votre code de vérification Okapi Real Estate est : *{{2}}*.
 *   Ce code expire dans 10 minutes. Ne le partagez avec personne.
 *
 * Variable mapping in sendAgentOtp():
 *   {{1}} → agentName
 *   {{2}} → code
 * ──────────────────────────────────────────────────────────────────────────
 *
 * If either env var is missing, all methods log a warning and return silently
 * so the rest of the registration flow is never blocked by WhatsApp failures.
 */
@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token = process.env.WHATSAPP_TOKEN;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly apiVersion = "v20.0";

  async onModuleInit() {
    if (!this.token || !this.phoneNumberId) {
      this.logger.warn(
        "⚠️  WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — WhatsApp messages will not be sent",
      );
    } else {
      this.logger.log("✅ WhatsApp Business Cloud API initialized");
    }
  }

  // ─── Public methods ────────────────────────────────────────────────────────

  /**
   * Sends the 6-digit OTP to the agent's WhatsApp number via a pre-approved template.
   *
   * Must be called with the agent's phone number (whatsappNumber preferred, phoneNumber fallback).
   * If no WhatsApp number is available, silently skips.
   */
  async sendAgentOtp(
    phone: string | null | undefined,
    agentName: string,
    code: string,
  ): Promise<void> {
    if (!phone) return;
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE ?? "agent_otp";
    const languageCode = process.env.WHATSAPP_OTP_LANGUAGE ?? "fr";

    await this.sendTemplate(phone, templateName, languageCode, [
      {
        type: "body",
        parameters: [
          { type: "text", text: agentName },
          { type: "text", text: code },
        ],
      },
    ]);
  }

  /**
   * Sends a free-text message to a phone number.
   *
   * ⚠️  This only works within a 24-hour "conversation window" after the
   * recipient last sent you a message. For first-contact / outbound use
   * sendTemplate() instead.
   *
   * Suitable for:
   *   – Listing approved/rejected (agent just registered → window open)
   *   – Boost confirmed (agent submitted payment → window likely open)
   *   – Any reply within 24h of an agent-initiated message
   */
  async sendText(phone: string, message: string): Promise<void> {
    await this.post(phone, {
      type: "text",
      text: { preview_url: false, body: message },
    });
  }

  /**
   * Sends a named template message.
   * Use this for all proactive outbound messages (subscription reminders,
   * listing expiry alerts, etc.) where the 24h window may not be open.
   *
   * The template must already be approved in Meta Business Manager.
   */
  async sendTemplate(
    phone: string,
    templateName: string,
    languageCode: string,
    components: unknown[] = [],
  ): Promise<void> {
    await this.post(phone, {
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async post(
    phone: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.token || !this.phoneNumberId) return;

    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) {
      this.logger.warn(
        "WhatsApp: skipping message — empty phone number after cleaning",
      );
      return;
    }

    const body = {
      messaging_product: "whatsapp",
      to: cleaned,
      ...payload,
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`Meta API ${res.status}: ${JSON.stringify(errBody)}`);
      }

      this.logger.log(`📱 WhatsApp sent → ${cleaned.slice(0, 6)}***`);
    } catch (err) {
      // Never crash the caller — WhatsApp is supplementary, email is primary.
      this.logger.error("Failed to send WhatsApp message", err);
    }
  }
}
