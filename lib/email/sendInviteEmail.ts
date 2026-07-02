import { getResendClient } from "./client";
import { env } from "@/lib/env";

function buildInviteEmailHtml({
  organizationName,
  inviterEmail,
  acceptUrl,
}: {
  organizationName: string;
  inviterEmail: string;
  acceptUrl: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 18px; margin-bottom: 8px;">You're invited to join ${organizationName}</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        ${inviterEmail} invited you to collaborate on ${organizationName} on my-api.
      </p>
      <p style="margin: 24px 0;">
        <a href="${acceptUrl}" style="background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Accept invite
        </a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">
        This link expires in 7 days. If you weren't expecting this, you can ignore this email.
      </p>
    </div>
  `.trim();
}

/**
 * Sends the invite email. Never throws — a failed send does not fail invite
 * creation (the Invite row still exists; the owner can resend later). Returns
 * whether the send succeeded so callers can surface that to the UI.
 */
export async function sendInviteEmail({
  to,
  organizationName,
  inviterEmail,
  acceptUrl,
}: {
  to: string;
  organizationName: string;
  inviterEmail: string;
  acceptUrl: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping invite email send");
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: `You're invited to join ${organizationName}`,
      html: buildInviteEmailHtml({ organizationName, inviterEmail, acceptUrl }),
    });
    if (error) {
      console.error("[email] sendInviteEmail failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] sendInviteEmail threw:", err);
    return false;
  }
}
