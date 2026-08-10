import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends a transactional email via Resend when RESEND_API_KEY is configured.
 * Falls back to a server-side console log so flows stay testable in dev.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? "HRMS <no-reply@yourhrms.com>",
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      if (res.ok) return true;
      console.error("Resend email failed:", await res.text());
    } catch (error) {
      console.error("Resend email error:", error);
    }
    return false;
  }

  console.log(`[email:dev] To ${payload.to} — ${payload.subject}`);
  console.log(`[email:dev] ${payload.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}`);
  return true;
}

export function inviteEmailHtml(opts: {
  inviteUrl: string;
  fullName: string;
  companyName: string;
}) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px;color:#181c32">You're invited to ${opts.companyName}</h2>
      <p style="color:#5e6278;line-height:1.6">Hi ${opts.fullName},</p>
      <p style="color:#5e6278;line-height:1.6">
        Your company has added you to HRMS. Click the button below to set your
        password and activate your account. The link expires in 7 days.
      </p>
      <a href="${opts.inviteUrl}"
         style="display:inline-block;background:#7239ea;color:#fff;text-decoration:none;
                padding:12px 20px;border-radius:8px;font-weight:600;margin:16px 0">
        Set my password
      </a>
      <p style="color:#99a1b7;font-size:12px">Or paste this link: <a href="${opts.inviteUrl}">${opts.inviteUrl}</a></p>
    </div>
  `;
}
