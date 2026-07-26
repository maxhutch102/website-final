import { eq } from "drizzle-orm";
import { createSession, safeRelativeReturnPath, sessionCookie } from "@/app/chatgpt-auth";
import { verifyPassword } from "@/app/auth-password";
import { getDb } from "@/db";
import { employeePasswords, employees } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/crm"));
  const db = await getDb();
  const [employee] = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
  const isOwner = email === "mhutchi2517@gmail.com";
  const [credentials] = await db.select().from(employeePasswords)
    .where(eq(employeePasswords.email, email)).limit(1);

  const valid = credentials
    ? await verifyPassword(password, credentials.passwordHash, credentials.passwordSalt, credentials.iterations)
    : false;
  if (!valid || (!employee && !isOwner) || (employee && employee.status !== "active")) {
    return Response.redirect(new URL(`/login?error=invalid&email=${encodeURIComponent(email)}`, request.url), 303);
  }

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
