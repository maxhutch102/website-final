import { eq } from "drizzle-orm";
import { createEmailToken, sendAuthEmail } from "@/app/auth-email";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { authSessions, employeePasswords, employees } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const id = Number(input.employeeId);
  const db = await getDb();
  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!employee) return Response.json({ error: "Employee not found." }, { status: 404 });
  if (employee.status !== "active") {
    return Response.json({ error: "Activate this employee before sending account access." }, { status: 400 });
  }
  const token = await createEmailToken(employee.email, "password-reset", "/crm");
  await sendAuthEmail(request, employee.email, "password-reset", token);
  await logActivity(actor, "employee.access_sent", "employee", employee.id, `Sent an account setup/reset link to ${employee.email}.`);
  return Response.json({ ok: true, message: `Secure account link sent to ${employee.email}.` });
}

export async function DELETE(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const id = Number(new URL(request.url).searchParams.get("employeeId"));
  const db = await getDb();
  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!employee) return Response.json({ error: "Employee not found." }, { status: 404 });
  await Promise.all([
    db.delete(employeePasswords).where(eq(employeePasswords.email, employee.email)),
    db.delete(authSessions).where(eq(authSessions.email, employee.email)),
  ]);
  await logActivity(actor, "employee.access_reset", "employee", employee.id, `Removed password and active sessions for ${employee.email}.`);
  return Response.json({ ok: true, message: "Account access removed. Send a new setup link when ready." });
}
