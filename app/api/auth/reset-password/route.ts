import { and, eq, gt, isNull } from "drizzle-orm";
import { tokenPurpose } from "@/app/auth-email";
import { createSession, sessionCookie, sha256 } from "@/app/chatgpt-auth";
import { hashPassword, validatePassword } from "@/app/auth-password";
import { getDb } from "@/db";
import { authLoginTokens, employeePasswords } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const confirmation = String(form.get("confirmation") || "");
  if (password !== confirmation) {
    return Response.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}&error=match`, request.url), 303);
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}&error=rules`, request.url), 303);
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const [record] = await db.select().from(authLoginTokens).where(and(
    eq(authLoginTokens.tokenHash, await sha256(token)),
    gt(authLoginTokens.expiresAt, now),
    isNull(authLoginTokens.usedAt),
  )).limit(1);
  if (!record || tokenPurpose(record.returnTo).purpose !== "password-reset") {
    return Response.redirect(new URL("/forgot-password?error=expired", request.url), 303);
  }

  const passwordData = await hashPassword(password);
  const [existing] = await db.select().from(employeePasswords)
    .where(eq(employeePasswords.email, record.email)).limit(1);
  if (existing) {
    await db.update(employeePasswords).set({ ...passwordData, updatedAt: now })
      .where(eq(employeePasswords.id, existing.id));
  } else {
    await db.insert(employeePasswords).values({
      email: record.email,
      ...passwordData,
      createdAt: now,
      updatedAt: now,
    });
  }
  await db.update(authLoginTokens).set({ usedAt: now }).where(eq(authLoginTokens.id, record.id));
  const session = await createSession(record.email);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/crm", request.url).toString(),
      "Set-Cookie": sessionCookie(session.token, session.expires),
      "Cache-Control": "no-store",
    },
  });
}
