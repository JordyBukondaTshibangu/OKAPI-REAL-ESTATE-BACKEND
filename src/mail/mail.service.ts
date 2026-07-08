import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

const LOGO_URL =
  process.env.MAIL_LOGO_URL ??
  "https://pub-d5cad4963b964b9ba2720a29b5780d2b.r2.dev/brand/okapi-logo.png";

const NAVY = "#0B1D3A";
const GOLD = "#C9A84C";

/** Minimal shared wrapper so every email has the same header/footer. */
function layout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${NAVY};padding:24px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="Okapi Real Estate" height="48" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#1a1a2e;">
            <h2 style="margin:0 0 16px;font-size:20px;color:${NAVY};">${title}</h2>
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F2F4F7;padding:20px 32px;text-align:center;font-size:12px;color:#6b7280;">
            Okapi Real Estate · contact@okapi-real-estate.com<br/>
            <span style="color:${GOLD};">Rooted in the Congo, Building Your Future</span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    this.logger.log(
      `MailService ready — host=${process.env.MAIL_HOST ?? "smtp.gmail.com"} ` +
      `port=${process.env.MAIL_PORT ?? 587} ` +
      `user=${process.env.MAIL_USER ?? "(not set)"}`,
    );
  }

  private async send(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Okapi Real Estate" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to} — subject: "${subject}"`, err);
      throw err; // rethrow so callers know it failed
    }
  }

  // ---------------------------------------------------------------------------
  // Password reset
  // ---------------------------------------------------------------------------

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3001"}/reset-password?token=${token}`;
    const body = `
      <p>You requested a password reset for your Okapi agent account.</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}"
           style="background:${NAVY};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
    `;
    await this.send(email, "Password Reset — Okapi Real Estate", layout("Reset your password", body));
  }

  // ---------------------------------------------------------------------------
  // Agent self-signup: email OTP
  // ---------------------------------------------------------------------------

  /**
   * Sends a 6-digit OTP to the agent's email address to confirm they own it.
   * Called automatically on register and on resend requests.
   */
  async sendAgentEmailOtp(email: string, agentName: string, code: string) {
    const body = `
      <p>Hi <strong>${agentName}</strong>,</p>
      <p>Welcome to Okapi Real Estate! To complete your registration, enter the code below in the app.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;background:${NAVY};color:${GOLD};
                    font-size:36px;font-weight:bold;letter-spacing:10px;
                    padding:18px 32px;border-radius:10px;">
          ${code}
        </div>
      </div>
      <p style="font-size:13px;color:#6b7280;">
        This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
      </p>
      <p style="font-size:13px;color:#6b7280;">
        If you did not create an Okapi agent account, please ignore this email.
      </p>
    `;
    await this.send(
      email,
      "Your Okapi verification code",
      layout("Verify your email address", body),
    );
  }

  // ---------------------------------------------------------------------------
  // Admin: new agent pending approval
  // ---------------------------------------------------------------------------

  /**
   * Notifies the admin that a newly registered agent has verified their email
   * and is waiting for manual approval before becoming visible in search.
   */
  async sendAdminAgentPendingApproval(opts: {
    agentName: string;
    agentEmail: string;
    agentPhone: string | null;
    agentId: string;
  }) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.MAIL_USER;
    if (!adminEmail) {
      this.logger.warn("ADMIN_NOTIFICATION_EMAIL not set — skipping admin notification");
      return;
    }

    const dashboardUrl = `${process.env.DASHBOARD_URL ?? "http://localhost:3001"}/agents/${opts.agentId}`;

    const body = `
      <p>A new agent has completed email verification and is waiting for your approval.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#F2F4F7;">
          <td style="padding:10px 14px;font-weight:bold;width:120px;">Name</td>
          <td style="padding:10px 14px;">${opts.agentName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:bold;">Email</td>
          <td style="padding:10px 14px;">${opts.agentEmail}</td>
        </tr>
        <tr style="background:#F2F4F7;">
          <td style="padding:10px 14px;font-weight:bold;">Phone</td>
          <td style="padding:10px 14px;">${opts.agentPhone ?? "—"}</td>
        </tr>
      </table>
      <p style="text-align:center;margin:28px 0;">
        <a href="${dashboardUrl}"
           style="background:${NAVY};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Review &amp; Approve in Dashboard
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280;">
        Until you approve this agent, they remain invisible in public search
        and cannot publish listings.
      </p>
    `;
    await this.send(
      adminEmail,
      `New agent pending approval — ${opts.agentName}`,
      layout("Agent awaiting approval", body),
    );
  }
}
