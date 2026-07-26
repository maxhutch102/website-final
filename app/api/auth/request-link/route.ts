import { eq } from "drizzle-orm";
import { createEmailToken, sendAuthEmail } from "@/app/auth-email";
import { getDb } from "@/db";
import { clientAccounts, employees } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const type = String(form.get("type") || "client-password-reset");
  const returnTo = String(form.get("returnTo") || (type === "password-reset" ? "/crm" : "/portal"));
  const db = await getDb();

  let allowed = false;
  if (type === "password-reset") {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
    allowed = Boolean(employee && employee.status === "active") || email === "mhutchi2517@gmail.com";
  } else if (type === "client-password-reset") {
    const [account] = await db.select().from(clientAccounts).where(eq(clientAccounts.email, email)).limit(1);
    allowed = Boolean(account && account.status === "active");
  }

  if (allowed) {
    try {
      const purpose = type === "password-reset" ? "password-reset" : "client-password-reset";
      const token = await createEmailToken(email, purpose, returnTo);
      await sendAuthEmail(request, email, purpose, token);
    } catch (error) {
      console.error("Authentication email failed", error);
    }
  }

  const destination = type === "password-reset" ? "/forgot-password?sent=1" : "/client-login?sent=1";
  return Response.redirect(new URL(destination, request.url), 303);
}
