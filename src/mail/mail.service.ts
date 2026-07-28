import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Resend } from "resend";

interface AlertProperty {
  id: string;
  title: string;
  price: number;
  city: string;
  suburb?: string | null;
  listingType: string;
  category: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  verified: boolean;
  gallery: string[];
  whatsappNumber?: string | null;
  period?: string | null;
}

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
export class MailService implements OnModuleInit {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from = `Okapi Real Estate <${process.env.MAIL_FROM ?? "contact@okapi-real-estate.com"}>`;
  private readonly baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
  private readonly logoUrl = process.env.MAIL_LOGO_URL ?? "";

  /** Shared email header block with the Okapi logo. */
  private emailHeader(): string {
    const logoBlock = this.logoUrl
      ? `<img src="${this.logoUrl}" width="180" height="60" alt="Okapi Real Estate" style="display:block; max-width:180px; height:auto; border:0;" />`
      : `<table role="presentation" cellpadding="0" cellspacing="0">
           <tr>
             <td valign="middle" width="56" style="padding-right:14px;">
               <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                 <td style="background-color:#C9A84C; border-radius:10px; width:48px; height:48px; text-align:center; vertical-align:middle;" width="48" height="48">
                   <table role="presentation" width="100%" height="48" cellpadding="0" cellspacing="0"><tr>
                     <td align="center" valign="middle" style="font-family:Helvetica, Arial, sans-serif; font-size:22px; line-height:48px; color:#0D1B2A; font-weight:bold;">🏠</td>
                   </tr></table>
                 </td>
               </tr></table>
             </td>
             <td valign="middle">
               <span style="font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#C9A84C; letter-spacing:2px;">OKAPI</span><br>
               <span style="font-family:Helvetica, Arial, sans-serif; font-size:10px; color:#A0B0C8; letter-spacing:2px;">REAL ESTATE</span>
             </td>
           </tr>
         </table>`;
    return `<tr>
  <td style="background-color:#0D1B2A; padding:28px 40px;">
    ${logoBlock}
  </td>
</tr>`;
  }

  constructor() {
    // Resend throws in the constructor if the key is missing, so we guard it.
    this.resend = new Resend(process.env.RESEND_API_KEY ?? "missing");
  }

  async onModuleInit() {
    if (!process.env.RESEND_API_KEY) {
      this.logger.error("❌ RESEND_API_KEY is not set — emails will not be sent");
    } else {
      this.logger.log("✅ Resend mail client initialized");
    }
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

  private async send(to: string, subject: string, html: string) {
    try {
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) throw error;
      this.logger.log(`📧 Email sent: "${subject}" → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send "${subject}" to ${to}`, err);
    }
  }

  // ─── Welcome ────────────────────────────────────────────────────────────────

  async sendWelcome(email: string, firstName: string) {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenue chez Okapi Real Estate</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F2ED; font-family:Helvetica, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  Bienvenue chez Okapi Real Estate — votre compte est prêt. Trouvez ou publiez un bien en toute confiance.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F2ED;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <!-- HEADER -->
        ${this.emailHeader()}
        <!-- HERO -->
        <tr>
          <td style="background-color:#0D1B2A; padding:0 40px 44px 40px;">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:26px; line-height:34px; font-weight:bold; color:#FFFFFF;">
              Bienvenue sur Okapi,<br><span style="color:#C9A84C;">${firstName}</span> 👋
            </p>
            <p style="margin:14px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:21px; color:#CBD5E1;">
              Votre compte est prêt. Vous pouvez dès maintenant chercher un logement<br>
              ou publier votre première annonce à Kinshasa.
            </p>
          </td>
        </tr>
        <!-- CTA BUTTON -->
        <tr>
          <td style="padding:36px 40px 8px 40px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#C9A84C; border-radius:8px;">
                  <a href="${dashboardUrl}" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A; text-decoration:none;">
                    Accéder à mon compte →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- INTRO TEXT -->
        <tr>
          <td style="padding:20px 40px 8px 40px;">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:22px; color:#3D3D3A; text-align:center;">
              Okapi Real Estate est la première plateforme immobilière vérifiée de Kinshasa.
              Chaque annonce est contrôlée par notre équipe avant publication —
              pour que vous puissiez chercher ou louer en toute confiance.
            </p>
          </td>
        </tr>
        <!-- DIVIDER -->
        <tr>
          <td style="padding:28px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <!-- 3 STEPS -->
        <tr>
          <td style="padding:28px 40px 8px 40px;">
            <p style="margin:0 0 18px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; color:#C9A84C; letter-spacing:1.5px;">POUR COMMENCER</p>
            <!-- Step 1 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
              <tr>
                <td width="40" valign="top">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#0D1B2A; border-radius:50%; width:28px; height:28px; text-align:center;" width="28" height="28">
                        <table role="presentation" width="28" height="28" cellpadding="0" cellspacing="0">
                          <tr><td align="center" valign="middle" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; font-weight:bold; color:#C9A84C;">1</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:14px; font-weight:bold; color:#0D1B2A;">Complétez votre profil</p>
                  <p style="margin:4px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#7A7975;">Ajoutez votre photo et votre numéro WhatsApp pour que les autres utilisateurs puissent vous contacter facilement.</p>
                </td>
              </tr>
            </table>
            <!-- Step 2 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
              <tr>
                <td width="40" valign="top">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#0D1B2A; border-radius:50%; width:28px; height:28px; text-align:center;" width="28" height="28">
                        <table role="presentation" width="28" height="28" cellpadding="0" cellspacing="0">
                          <tr><td align="center" valign="middle" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; font-weight:bold; color:#C9A84C;">2</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:14px; font-weight:bold; color:#0D1B2A;">Cherchez ou publiez un bien</p>
                  <p style="margin:4px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#7A7975;">Parcourez les annonces vérifiées par commune, ou ajoutez votre premier bien si vous êtes agent.</p>
                </td>
              </tr>
            </table>
            <!-- Step 3 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr>
                <td width="40" valign="top">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#0D1B2A; border-radius:50%; width:28px; height:28px; text-align:center;" width="28" height="28">
                        <table role="presentation" width="28" height="28" cellpadding="0" cellspacing="0">
                          <tr><td align="center" valign="middle" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; font-weight:bold; color:#C9A84C;">3</td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:14px; font-weight:bold; color:#0D1B2A;">Contactez directement sur WhatsApp</p>
                  <p style="margin:4px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#7A7975;">Chaque annonce a un bouton WhatsApp direct — sans intermédiaire, sans attente.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- TRUST BANNER -->
        <tr>
          <td style="padding:8px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5E6C0; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" valign="top" style="font-size:18px;">🛡️</td>
                      <td valign="top" style="padding-left:8px;">
                        <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#0D1B2A;">
                          <strong>100&nbsp;% des annonces sont vérifiées</strong> par notre équipe avant publication. Aucune surprise, aucune arnaque.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- SUPPORT -->
        <tr>
          <td style="padding:32px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 32px 40px;" align="center">
            <p style="margin:0 0 6px 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A7975;">Une question ? Notre équipe est là pour vous aider.</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px;">
              <a href="mailto:contact@okapi-real-estate.com" style="color:#185FA5; text-decoration:none; font-weight:bold;">contact@okapi-real-estate.com</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/243000000000" style="color:#0F6E56; text-decoration:none; font-weight:bold;">WhatsApp</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- FOOTER -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; margin-top:24px;">
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0 0 8px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#7A7975;">Okapi Real Estate · Kinshasa, République Démocratique du Congo</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#A8A8A4;">
              Vous recevez cet e-mail car vous avez créé un compte sur Okapi Real Estate.<br>
              <a href="#" style="color:#A8A8A4; text-decoration:underline;">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    await this.send(email, "Bienvenue chez Okapi Real Estate", html);
  }

  // ─── Forgot Password ────────────────────────────────────────────────────────

  async sendPasswordReset(email: string, token: string, firstName: string) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Réinitialisation de votre mot de passe — Okapi Real Estate</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F2ED; font-family:Helvetica, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  Réinitialisez votre mot de passe Okapi Real Estate. Ce lien expire dans 1 heure.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F2ED;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <!-- HEADER -->
        ${this.emailHeader()}
        <!-- HERO -->
        <tr>
          <td style="background-color:#0D1B2A; padding:0 40px 44px 40px;">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:24px; line-height:32px; font-weight:bold; color:#FFFFFF;">
              🔑 Réinitialisez votre<br>mot de passe
            </p>
            <p style="margin:14px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:21px; color:#CBD5E1;">
              Bonjour ${firstName}, nous avons reçu une demande de<br>
              réinitialisation de mot de passe pour votre compte.
            </p>
          </td>
        </tr>
        <!-- CTA BUTTON -->
        <tr>
          <td style="padding:36px 40px 8px 40px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#C9A84C; border-radius:8px;">
                  <a href="${resetUrl}" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A; text-decoration:none;">
                    Réinitialiser mon mot de passe →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- EXPIRY NOTICE -->
        <tr>
          <td style="padding:20px 40px 8px 40px;" align="center">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A7975;">
              ⏱️ Ce lien expire dans <strong style="color:#0D1B2A;">1 heure</strong>, pour votre sécurité.
            </p>
          </td>
        </tr>
        <!-- FALLBACK LINK -->
        <tr>
          <td style="padding:20px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F8F5; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975;">
                    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                  </p>
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#185FA5; word-break:break-all;">
                    ${resetUrl}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- SECURITY NOTICE -->
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF3C7; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" valign="top" style="font-size:16px;">🛡️</td>
                      <td valign="top" style="padding-left:8px;">
                        <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#0D1B2A;">
                          Vous n'avez pas demandé cette réinitialisation ? Ignorez simplement cet e-mail — votre mot de passe actuel reste inchangé et votre compte est en sécurité.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- SECURITY TIP -->
        <tr>
          <td style="padding:28px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 8px 40px;">
            <p style="margin:0 0 14px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; color:#C9A84C; letter-spacing:1.5px;">CONSEIL DE SÉCURITÉ</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:20px; color:#3D3D3A;">
              Choisissez un mot de passe unique que vous n'utilisez sur aucun autre site, et ne le partagez jamais — même avec un agent ou un membre du support Okapi.
            </p>
          </td>
        </tr>
        <!-- SUPPORT -->
        <tr>
          <td style="padding:24px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 32px 40px;" align="center">
            <p style="margin:0 0 6px 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A7975;">Besoin d'aide pour accéder à votre compte ?</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px;">
              <a href="mailto:contact@okapi-real-estate.com" style="color:#185FA5; text-decoration:none; font-weight:bold;">contact@okapi-real-estate.com</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/243000000000" style="color:#0F6E56; text-decoration:none; font-weight:bold;">WhatsApp</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- FOOTER -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; margin-top:24px;">
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0 0 8px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#7A7975;">Okapi Real Estate · Kinshasa, République Démocratique du Congo</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#A8A8A4;">
              Cet e-mail confirme une action de sécurité sur votre compte Okapi Real Estate.<br>
              Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    await this.send(email, "Réinitialisation de votre mot de passe — Okapi Real Estate", html);
  }

  // ─── Account Deleted ────────────────────────────────────────────────────────

  async sendAccountDeleted(email: string, firstName: string) {
    const deletionDate = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmation de suppression de compte — Okapi Real Estate</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F2ED; font-family:Helvetica, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  Votre compte Okapi Real Estate a été supprimé. Voici ce que cela signifie et comment revenir si vous changez d'avis.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F2ED;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <!-- HEADER -->
        ${this.emailHeader()}
        <!-- HERO -->
        <tr>
          <td style="background-color:#0D1B2A; padding:0 40px 44px 40px;">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:24px; line-height:32px; font-weight:bold; color:#FFFFFF;">
              Votre compte a été supprimé
            </p>
            <p style="margin:14px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:21px; color:#CBD5E1;">
              Bonjour ${firstName}, nous confirmons la suppression de votre compte<br>
              Okapi Real Estate, comme demandé.
            </p>
          </td>
        </tr>
        <!-- CONFIRMATION DETAILS CARD -->
        <tr>
          <td style="padding:32px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F8F5; border-radius:8px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975; padding-bottom:6px;">Compte</td>
                      <td align="right" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#0D1B2A; font-weight:bold; padding-bottom:6px;">${email}</td>
                    </tr>
                    <tr>
                      <td style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975; padding-bottom:6px;">Date de suppression</td>
                      <td align="right" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#0D1B2A; font-weight:bold; padding-bottom:6px;">${deletionDate}</td>
                    </tr>
                    <tr>
                      <td style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975;">Statut</td>
                      <td align="right" style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#C0392B; font-weight:bold;">Supprimé</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- WHAT WAS DELETED -->
        <tr>
          <td style="padding:28px 40px 8px 40px;">
            <p style="margin:0 0 16px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; color:#C9A84C; letter-spacing:1.5px;">CE QUI A ÉTÉ SUPPRIMÉ</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td width="28" valign="top" style="font-size:15px; padding-top:1px;">✅</td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#3D3D3A;">Votre profil et vos informations personnelles</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td width="28" valign="top" style="font-size:15px; padding-top:1px;">✅</td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#3D3D3A;">Toutes vos annonces publiées ou en brouillon</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr>
                <td width="28" valign="top" style="font-size:15px; padding-top:1px;">✅</td>
                <td valign="top" style="padding-left:8px;">
                  <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#3D3D3A;">Votre historique de recherches et favoris</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- RETENTION NOTICE -->
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF3C7; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" valign="top" style="font-size:16px;">🕒</td>
                      <td valign="top" style="padding-left:8px;">
                        <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#0D1B2A;">
                          Vos données seront conservées pendant <strong>30 jours</strong> à des fins légales et de sécurité, puis définitivement effacées de nos systèmes.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- CHANGED YOUR MIND -->
        <tr>
          <td style="padding:28px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 8px 40px;">
            <p style="margin:0 0 6px 0; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A;">Vous avez changé d'avis ?</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:20px; color:#7A7975;">
              Si cette suppression n'était pas intentionnelle, ou si vous souhaitez restaurer votre compte dans les 30 jours, contactez notre équipe dès que possible.
            </p>
          </td>
        </tr>
        <!-- CTA BUTTON -->
        <tr>
          <td style="padding:18px 40px 8px 40px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#C9A84C; border-radius:8px;">
                  <a href="mailto:contact@okapi-real-estate.com?subject=Restauration%20de%20compte" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A; text-decoration:none;">
                    Contacter le support →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- SUPPORT -->
        <tr>
          <td style="padding:32px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 32px 40px;" align="center">
            <p style="margin:0 0 6px 0; font-family:Helvetica, Arial, sans-serif; font-size:13px; color:#7A7975;">Une question sur cette suppression ?</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px;">
              <a href="mailto:contact@okapi-real-estate.com" style="color:#185FA5; text-decoration:none; font-weight:bold;">contact@okapi-real-estate.com</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/243000000000" style="color:#0F6E56; text-decoration:none; font-weight:bold;">WhatsApp</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- FOOTER -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; margin-top:24px;">
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0 0 8px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#7A7975;">Okapi Real Estate · Kinshasa, République Démocratique du Congo</p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#A8A8A4;">
              Cet e-mail confirme une action de sécurité sur votre compte Okapi Real Estate.<br>
              Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    await this.send(email, "Confirmation de suppression de votre compte Okapi", html);
  }

  // ─── Boost Notifications ────────────────────────────────────────────────────

  /** Notify admin of new boost payment request. */
  async sendAdminNewBoostRequest(opts: {
    agentName: string;
    agentEmail: string;
    propertyTitle: string;
    durationDays: number;
    amount: number;
    paymentMethod: string;
    reference: string;
    boostRequestId: string;
  }) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.MAIL_USER;
    if (!adminEmail) {
      this.logger.warn("ADMIN_NOTIFICATION_EMAIL not set — skipping boost admin notification");
      return;
    }
    const dashboardUrl = `${process.env.DASHBOARD_URL ?? "http://localhost:3002"}/boosts`;
    const methodLabel: Record<string, string> = {
      ORANGE_MONEY: "Orange Money",
      MTN_MONEY: "MTN Money",
      AIRTEL_MONEY: "Airtel Money",
      MPESA: "M-Pesa (Vodacom)",
      CASH: "Cash",
    };
    const body = `
      <p>Un agent a soumis une demande de boost et attend votre validation.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;width:150px;">Agent</td><td style="padding:10px 14px;">${opts.agentName} (${opts.agentEmail})</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Annonce</td><td style="padding:10px 14px;">${opts.propertyTitle}</td></tr>
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;">Durée</td><td style="padding:10px 14px;">${opts.durationDays} jours — ${opts.amount} $</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Paiement</td><td style="padding:10px 14px;">${methodLabel[opts.paymentMethod] ?? opts.paymentMethod}</td></tr>
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;">Référence</td><td style="padding:10px 14px;font-family:monospace;font-size:15px;color:${NAVY};"><strong>${opts.reference}</strong></td></tr>
      </table>
      <p style="text-align:center;margin:28px 0;">
        <a href="${dashboardUrl}" style="background:${NAVY};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Vérifier dans le Dashboard →
        </a>
      </p>
    `;
    await this.send(adminEmail, `💰 Nouvelle demande de boost — ${opts.propertyTitle}`, layout("Demande de boost à valider", body));
  }

  /** Notify agent their boost has been confirmed. */
  async sendBoostConfirmed(opts: {
    agentEmail: string;
    agentName: string;
    propertyTitle: string;
    durationDays: number;
    boostedUntil: Date;
  }) {
    const untilStr = opts.boostedUntil.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Votre paiement a été vérifié. Votre annonce est maintenant <strong style="color:${GOLD};">En vedette</strong> dans les résultats de recherche.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;width:130px;">Annonce</td><td style="padding:10px 14px;">${opts.propertyTitle}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Durée</td><td style="padding:10px 14px;">${opts.durationDays} jours</td></tr>
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;">Actif jusqu'au</td><td style="padding:10px 14px;">${untilStr}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">
        Pendant cette période, votre annonce apparaît en tête de liste avec le badge ✨ <em>En vedette</em>.
      </p>
    `;
    await this.send(opts.agentEmail, `✅ Boost confirmé — ${opts.propertyTitle}`, layout("Votre boost est actif !", body));
  }

  /** Notify agent their boost was rejected. */
  async sendBoostRejected(opts: {
    agentEmail: string;
    agentName: string;
    propertyTitle: string;
    reason: string;
  }) {
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Nous n'avons pas pu confirmer votre paiement pour le boost de l'annonce <strong>${opts.propertyTitle}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#FEE2E2;"><td style="padding:10px 14px;font-weight:bold;width:130px;">Raison</td><td style="padding:10px 14px;color:#B91C1C;">${opts.reason}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">
        Vous pouvez soumettre une nouvelle demande depuis votre espace agent, en vous assurant que la référence de paiement est correcte.
      </p>
    `;
    await this.send(opts.agentEmail, `❌ Boost refusé — ${opts.propertyTitle}`, layout("Demande de boost refusée", body));
  }

  // ─── Subscriptions ──────────────────────────────────────────────────────────

  async sendAdminNewSubscriptionRequest(opts: {
    agentName: string;
    agentEmail: string;
    tier: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    subscriptionRequestId: string;
  }) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.MAIL_USER;
    if (!adminEmail) return;
    const dashboardUrl = `${process.env.DASHBOARD_URL ?? "http://localhost:3002"}/subscriptions`;
    const methodLabel: Record<string, string> = {
      ORANGE_MONEY: "Orange Money", MTN_MONEY: "MTN Money",
      AIRTEL_MONEY: "Airtel Money", MPESA: "M-Pesa (Vodacom)", CASH: "Cash",
    };
    const body = `
      <p>Un agent souhaite souscrire à un abonnement et attend votre validation.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;width:150px;">Agent</td><td style="padding:10px 14px;">${opts.agentName} (${opts.agentEmail})</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Plan</td><td style="padding:10px 14px;">${opts.tier} — ${opts.amount} $/mois</td></tr>
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;">Paiement</td><td style="padding:10px 14px;">${methodLabel[opts.paymentMethod] ?? opts.paymentMethod}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Référence</td><td style="padding:10px 14px;font-family:monospace;font-size:15px;color:${NAVY};"><strong>${opts.reference}</strong></td></tr>
      </table>
      <p style="text-align:center;margin:28px 0;">
        <a href="${dashboardUrl}" style="background:${NAVY};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Vérifier dans le Dashboard →
        </a>
      </p>
    `;
    await this.send(adminEmail, `🌟 Nouvelle demande d'abonnement ${opts.tier} — ${opts.agentName}`, layout("Abonnement à valider", body));
  }

  async sendSubscriptionConfirmed(opts: {
    agentEmail: string;
    agentName: string;
    tier: string;
    amount: number;
    periodEnd: Date;
  }) {
    if (!opts.agentEmail) return;
    const untilStr = opts.periodEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Votre paiement a été vérifié. Votre abonnement <strong style="color:${GOLD};">${opts.tier}</strong> est maintenant actif.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#F2F4F7;"><td style="padding:10px 14px;font-weight:bold;width:130px;">Plan</td><td style="padding:10px 14px;">${opts.tier} — ${opts.amount} $/mois</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;">Valable jusqu'au</td><td style="padding:10px 14px;">${untilStr}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">
        Vous pouvez publier des annonces sans limite et accéder à vos statistiques de performance.
      </p>
    `;
    await this.send(opts.agentEmail, `✅ Abonnement ${opts.tier} activé`, layout("Votre abonnement est actif !", body));
  }

  async sendSubscriptionRejected(opts: {
    agentEmail: string;
    agentName: string;
    tier: string;
    reason: string;
  }) {
    if (!opts.agentEmail) return;
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Nous n'avons pas pu confirmer votre paiement pour l'abonnement <strong>${opts.tier}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="background:#FEE2E2;"><td style="padding:10px 14px;font-weight:bold;width:130px;">Raison</td><td style="padding:10px 14px;color:#B91C1C;">${opts.reason}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">
        Vous pouvez soumettre une nouvelle demande depuis votre espace agent en vous assurant que la référence de paiement est correcte.
      </p>
    `;
    await this.send(opts.agentEmail, `❌ Abonnement ${opts.tier} refusé`, layout("Demande d'abonnement refusée", body));
  }

  async sendSubscriptionRenewalReminder(opts: {
    agentEmail: string;
    agentName: string;
    tier: string;
    expiresAt: Date;
  }) {
    if (!opts.agentEmail) return;
    const expiryStr = opts.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const renewUrl = `${this.baseUrl}/espace-agent/abonnement`;
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Votre abonnement <strong style="color:${GOLD};">${opts.tier}</strong> expire le <strong>${expiryStr}</strong> — dans 7 jours.</p>
      <p>Pour maintenir un accès illimité aux annonces et à vos statistiques, renouvelez maintenant.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${renewUrl}" style="background:${GOLD};color:${NAVY};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Renouveler mon abonnement →
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280;">
        Sans renouvellement, votre compte reviendra au plan gratuit (max. 10 annonces actives) à partir du ${expiryStr}.
      </p>
    `;
    await this.send(opts.agentEmail, `⏳ Votre abonnement ${opts.tier} expire dans 7 jours`, layout("Rappel de renouvellement", body));
  }

  async sendSubscriptionExpired(opts: {
    agentEmail: string;
    agentName: string;
    hiddenCount: number;
  }) {
    if (!opts.agentEmail) return;
    const renewUrl = `${this.baseUrl}/espace-agent/abonnement`;
    const overflowNote = opts.hiddenCount > 0
      ? `<p style="color:#B91C1C;font-weight:bold;">${opts.hiddenCount} de vos annonces ont été masquées (limite gratuite : 10 annonces actives).</p>`
      : "";
    const body = `
      <p>Bonjour <strong>${opts.agentName}</strong>,</p>
      <p>Votre abonnement a expiré. Votre compte est revenu au plan <strong>Gratuit</strong>.</p>
      ${overflowNote}
      <p style="text-align:center;margin:28px 0;">
        <a href="${renewUrl}" style="background:${GOLD};color:${NAVY};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
          Renouveler mon abonnement →
        </a>
      </p>
    `;
    await this.send(opts.agentEmail, "⚠️ Votre abonnement Okapi a expiré", layout("Abonnement expiré", body));
  }

  // ─── Property Alert ─────────────────────────────────────────────────────────

  async sendPropertyAlert(
    email: string,
    firstName: string,
    alertName: string,
    alertCriteria: string,
    properties: AlertProperty[],
  ) {
    const count = properties.length;
    const heroCount = `${count} nouvelle${count > 1 ? "s" : ""} annonce${count > 1 ? "s" : ""}`;

    const propertyCards = properties.map((p) => {
      const location = [p.suburb, p.city].filter(Boolean).join(", ");
      const priceLabel = p.listingType === "for-rent"
        ? `${p.price.toLocaleString("fr-FR")} $ / ${p.period ?? "mois"}`
        : `${p.price.toLocaleString("fr-FR")} $`;
      const waNumber = p.whatsappNumber?.replace(/\D/g, "") ?? "";
      const waText = encodeURIComponent(`Bonjour, je suis intéressé(e) par "${p.title}" à ${location}`);
      const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : `${this.baseUrl}/properties/${p.id}`;
      const imageBlock = p.gallery.length > 0
        ? `<img src="${p.gallery[0]}" width="520" height="160" style="display:block; width:100%; height:160px; object-fit:cover;" alt="${p.title}" />`
        : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background-color:#E5E1D8; height:160px; text-align:center; vertical-align:middle; font-size:34px;" height="160">🏠</td></tr></table>`;
      const verifiedBadge = p.verified
        ? `<span style="display:inline-block; background-color:#E1F5EE; color:#0F6E56; font-family:Helvetica, Arial, sans-serif; font-size:10px; font-weight:bold; padding:4px 10px; border-radius:12px;">🟢 Vérifié</span>`
        : "";

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F8F5; border-radius:10px; overflow:hidden; margin-bottom:0;">
          <tr><td>${imageBlock}</td></tr>
          <tr>
            <td style="padding:18px 20px 6px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top">
                    <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A;">${p.title}</p>
                    <p style="margin:2px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975;">📍 ${location}</p>
                  </td>
                  <td valign="top" align="right">${verifiedBadge}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 20px 18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:17px; font-weight:bold; color:#C9A84C;">${priceLabel}</p>
                  </td>
                  <td valign="middle" align="right">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#25A244; border-radius:6px;">
                          <a href="${waUrl}" target="_blank" style="display:inline-block; padding:9px 18px; font-family:Helvetica, Arial, sans-serif; font-size:12px; font-weight:bold; color:#FFFFFF; text-decoration:none;">💬 WhatsApp</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    }).join(`<tr><td style="height:16px;"></td></tr>`);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nouvelles annonces correspondant à votre recherche — Okapi Real Estate</title>
</head>
<body style="margin:0; padding:0; background-color:#F4F2ED; font-family:Helvetica, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  ${count} nouvelle${count > 1 ? "s" : ""} annonce${count > 1 ? "s" : ""} vérifiée${count > 1 ? "s" : ""} correspondent à votre alerte "${alertName}". Découvrez-les avant qu'elles ne partent.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F2ED;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <!-- HEADER -->
        ${this.emailHeader()}
        <!-- HERO -->
        <tr>
          <td style="background-color:#0D1B2A; padding:0 40px 36px 40px;">
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:24px; line-height:32px; font-weight:bold; color:#FFFFFF;">
              🔔 ${heroCount}<br>pour vous, ${firstName}
            </p>
            <p style="margin:14px 0 0 0; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:21px; color:#CBD5E1;">
              Correspondant à votre alerte : <strong style="color:#C9A84C;">${alertCriteria}</strong>
            </p>
          </td>
        </tr>
        <!-- LISTING CARDS -->
        <tr>
          <td style="padding:28px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${propertyCards}
            </table>
          </td>
        </tr>
        <!-- VIEW ALL CTA -->
        <tr>
          <td style="padding:28px 40px 8px 40px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#C9A84C; border-radius:8px;">
                  <a href="${this.baseUrl}/alertes" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#0D1B2A; text-decoration:none;">
                    Voir toutes les annonces →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- TRUST BANNER -->
        <tr>
          <td style="padding:24px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5E6C0; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" valign="top" style="font-size:18px;">🛡️</td>
                      <td valign="top" style="padding-left:8px;">
                        <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:19px; color:#0D1B2A;">
                          Toutes ces annonces ont été <strong>vérifiées par notre équipe</strong> avant publication. Visitez en toute confiance.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- MANAGE ALERT -->
        <tr>
          <td style="padding:28px 40px 8px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #EBEBEB; font-size:1px; line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px 40px;" align="center">
            <p style="margin:0 0 6px 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#7A7975;">
              Vous recevez cette alerte car vous avez sauvegardé une recherche.
            </p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:12px;">
              <a href="${this.baseUrl}/alertes" style="color:#185FA5; text-decoration:none; font-weight:bold;">Gérer mes alertes</a>
              &nbsp;·&nbsp;
              <a href="${this.baseUrl}/alertes" style="color:#7A7975; text-decoration:underline;">Désactiver cette alerte</a>
            </p>
          </td>
        </tr>
      </table>
      <!-- FOOTER -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; margin-top:24px;">
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0 0 8px 0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#7A7975;">
              Okapi Real Estate · Kinshasa, République Démocratique du Congo
            </p>
            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#A8A8A4;">
              <a href="mailto:contact@okapi-real-estate.com" style="color:#A8A8A4; text-decoration:underline;">contact@okapi-real-estate.com</a>
              &nbsp;·&nbsp;
              <a href="${this.baseUrl}/alertes" style="color:#A8A8A4; text-decoration:underline;">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    await this.send(email, `🔔 ${heroCount} pour votre alerte "${alertName}" — Okapi`, html);
  }
}
