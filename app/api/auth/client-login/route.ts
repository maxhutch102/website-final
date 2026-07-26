import { eq } from "drizzle-orm";
import { verifyPassword } from "@/app/auth-password";
import { createSession, safeRelativeReturnPath, sessionCookie } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { clientAccounts, clientPasswords } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/portal"));
  const db = await getDb();
  const [account] = await db.select().from(clientAccounts).where(eq(clientAccounts.email, email)).limit(1);
  const [credentials] = account
    ? await db.select().from(clientPasswords).where(eq(clientPasswords.clientAccountId, account.id)).limit(1)
    : [];
  const valid = credentials
    ? await verifyPassword(password, credentials.passwordHash, credentials.passwordSalt, credentials.iterations)
    : false;
  if (!account || account.status !== "active" || !valid) {
    return Response.redirect(new URL(`/client-login?error=invalid&email=${encodeURIComponent(email)}`, request.url), 303);
  }
  const now = new Date().toISOString();
  await db.update(clientAccounts).set({ lastLoginAt: now, updatedAt: now }).where(eq(clientAccounts.id, account.id));
  const session = await createSession(email);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(returnTo, request.url).toString(),
      "Set-Cookie": sessionCookie(session.token, session.expires),
      "Cache-Control": "no-store",
    },
  });
}
