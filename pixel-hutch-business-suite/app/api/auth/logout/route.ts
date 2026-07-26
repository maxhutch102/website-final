import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE, clearSessionCookie, safeRelativeReturnPath, sha256 } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { authSessions } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(authSessions).where(eq(authSessions.tokenHash, await sha256(token)));
  }
  const returnTo = safeRelativeReturnPath(new URL(request.url).searchParams.get("returnTo") || "/");
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(returnTo, request.url).toString(),
      "Set-Cookie": clearSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}
