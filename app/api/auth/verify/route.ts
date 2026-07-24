import { and, eq, gt, isNull } from "drizzle-orm";
import { tokenPurpose } from "@/app/auth-email";
import { createSession, sessionCookie, sha256 } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { authLoginTokens } from "@/db/schema";

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
  if (details.purpose !== "client-login") {
    return Response.redirect(new URL("/client-login?error=expired", request.url), 303);
  }
  await db.update(authLoginTokens).set({ usedAt: now }).where(eq(authLoginTokens.id, record.id));
  const session = await createSession(record.email);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(details.returnTo, request.url).toString(),
      "Set-Cookie": sessionCookie(session.token, session.expires),
      "Cache-Control": "no-store",
    },
  });
}
