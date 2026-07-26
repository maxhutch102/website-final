import { and, eq, gt, isNull } from "drizzle-orm";
import { tokenPurpose } from "@/app/auth-email";
import { sha256 } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { authLoginTokens, clientAccounts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const db = await getDb();
  const now = new Date().toISOString();
  const [record] = await db.select().from(authLoginTokens).where(and(
    eq(authLoginTokens.tokenHash, await sha256(token)),
    gt(authLoginTokens.expiresAt, now),
    isNull(authLoginTokens.usedAt),
  )).limit(1);
  if (!record) return Response.redirect(new URL("/client-login?error=expired", request.url), 303);
  const details = tokenPurpose(record.returnTo);
  if (details.purpose !== "client-activation") {
    return Response.redirect(new URL("/client-login?error=expired", request.url), 303);
  }
  const [account] = await db.select().from(clientAccounts).where(eq(clientAccounts.email, record.email.toLowerCase())).limit(1);
  if (!account) return Response.redirect(new URL("/client-login?error=account", request.url), 303);
  return Response.redirect(new URL(`/create-client-password?token=${encodeURIComponent(token)}`, request.url), 303);
}
