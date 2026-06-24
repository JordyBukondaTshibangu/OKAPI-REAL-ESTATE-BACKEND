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
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async onModuleInit() {
    if (!process.env.RESEND_API_KEY) {
      this.logger.error("❌ RESEND_API_KEY is not set — emails will not be sent");
    } else {
      this.logger.log("✅ Resend mail client initialized");
    }
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
