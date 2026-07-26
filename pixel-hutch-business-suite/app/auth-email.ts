import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authLoginTokens } from "@/db/schema";
import { randomToken, safeRelativeReturnPath, sha256 } from "@/app/chatgpt-auth";

export type AuthPurpose = "client-login" | "password-reset";

export async function createEmailToken(email: string, purpose: AuthPurpose, returnTo: string) {
  const db = await getDb();
  const token = randomToken();
  const now = new Date();
  await db.insert(authLoginTokens).values({
    email: email.toLowerCase(),
    tokenHash: await sha256(token),
    returnTo: `${purpose}:${safeRelativeReturnPath(returnTo)}`,
    expiresAt: new Date(now.getTime() + 20 * 60000).toISOString(),
    createdAt: now.toISOString(),
  });
  return token;
}

export async function sendAuthEmail(
  request: Request,
  email: string,
  purpose: AuthPurpose,
  token: string,
) {
  const { env } = await import("cloudflare:workers");
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  const origin = new URL(request.url).origin;
  const path = purpose === "client-login" ? "/api/auth/verify" : "/reset-password";
  const link = `${origin}${path}?token=${encodeURIComponent(token)}`;
  const isReset = purpose === "password-reset";
  const subject = isReset ? "Reset your Pixel Hutch password" : "Your Pixel Hutch client portal link";
  const action = isReset ? "Set a new password" : "Open your client portal";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || "Pixel Hutch <login@pixel-hutch.com>",
      to: [email],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#18221d">
        <img src="${origin}/pixel-hutch-logo.svg" alt="Pixel Hutch" style="height:52px">
        <h1 style="font-size:24px">${subject}</h1>
        <p>This secure link expires in 20 minutes and can only be used once.</p>
        <p><a href="${link}" style="display:inline-block;background:#f54702;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${action}</a></p>
        <p style="color:#68736c;font-size:13px">If you did not request this, you can ignore this email.</p>
      </div>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected the message (${response.status}).`);
}

export function tokenPurpose(value: string) {
  const separator = value.indexOf(":");
  if (separator < 0) return { purpose: "", returnTo: "/" };
  return {
    purpose: value.slice(0, separator),
    returnTo: safeRelativeReturnPath(value.slice(separator + 1)),
  };
}
