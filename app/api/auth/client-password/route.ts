import { and, eq, gt, isNull } from "drizzle-orm";
import { tokenPurpose } from "@/app/auth-email";
import { hashPassword, validatePassword } from "@/app/auth-password";
import { createSession, sessionCookie, sha256 } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { authLoginTokens, clientAccounts, clientPasswords } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const confirmation = String(form.get("confirmation") || "");
  const retry = `/create-client-password?token=${encodeURIComponent(token)}`;
  if (password !== confirmation) {
    return Response.redirect(new URL(`${retry}&error=match`, request.url), 303);
  }
  if (validatePassword(password)) {
    return Response.redirect(new URL(`${retry}&error=rules`, request.url), 303);
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const [record] = await db.select().from(authLoginTokens).where(and(
    eq(authLoginTokens.tokenHash, await sha256(token)),
    gt(authLoginTokens.expiresAt, now),
    isNull(authLoginTokens.usedAt),
  )).limit(1);
  if (!record) return Response.redirect(new URL("/client-login?error=expired", request.url), 303);
  const details = tokenPurpose(record.returnTo);
  if (!["client-activation", "client-password-reset"].includes(details.purpose)) {
    return Response.redirect(new URL("/client-login?error=expired", request.url), 303);
  }

  const [account] = await db.select().from(clientAccounts)
    .where(eq(clientAccounts.email, record.email.toLowerCase())).limit(1);
  if (!account) return Response.redirect(new URL("/client-login?error=account", request.url), 303);

  const passwordData = await hashPassword(password);
  const [existing] = await db.select().from(clientPasswords)
    .where(eq(clientPasswords.clientAccountId, account.id)).limit(1);
  if (existing) {
    await db.update(clientPasswords).set({ ...passwordData, updatedAt: now })
      .where(eq(clientPasswords.id, existing.id));
  } else {
    await db.insert(clientPasswords).values({
      clientAccountId: account.id, ...passwordData, createdAt: now, updatedAt: now,
    });
  }
  await db.update(authLoginTokens).set({ usedAt: now }).where(eq(authLoginTokens.id, record.id));
  await db.update(clientAccounts).set({
    status: "active",
    firstLoginAt: account.firstLoginAt || now,
    lastLoginAt: now,
    updatedAt: now,
  }).where(eq(clientAccounts.id, account.id));

  const session = await createSession(account.email);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(details.returnTo, request.url).toString(),
      "Set-Cookie": sessionCookie(session.token, session.expires),
      "Cache-Control": "no-store",
    },
  });
}
