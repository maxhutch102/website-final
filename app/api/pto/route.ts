import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { employees, ptoRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const rows = await db.select({
    id: ptoRequests.id, employeeId: ptoRequests.employeeId, firstName: employees.firstName,
    lastName: employees.lastName, type: ptoRequests.type, startDate: ptoRequests.startDate,
    endDate: ptoRequests.endDate, minutes: ptoRequests.minutes, reason: ptoRequests.reason,
    status: ptoRequests.status, reviewedBy: ptoRequests.reviewedBy, createdAt: ptoRequests.createdAt,
  }).from(ptoRequests).leftJoin(employees, eq(ptoRequests.employeeId, employees.id)).orderBy(desc(ptoRequests.createdAt));
  return Response.json({ requests: actor.role === "owner" || actor.role === "admin" ? rows : rows.filter(row => row.employeeId === actor.employeeId) });
}

export async function POST(request: Request) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const employeeId = actor.role === "owner" || actor.role === "admin" ? Number(input.employeeId || actor.employeeId) : Number(actor.employeeId);
  if (!employeeId || !input.startDate || !input.endDate) return Response.json({ error: "Employee and dates are required." }, { status: 400 });
  const now = new Date().toISOString();
  const db = await getDb();
  const result = await db.insert(ptoRequests).values({
    employeeId, type: String(input.type || "pto"), startDate: String(input.startDate), endDate: String(input.endDate),
    minutes: Math.max(0, Number(input.minutes || 0)), reason: String(input.reason || ""), status: "pending",
    createdAt: now, updatedAt: now,
  }).returning();
  await logActivity(actor, "pto.requested", "pto_request", result[0].id, `Submitted ${result[0].type.toUpperCase()} request.`);
  return Response.json({ request: result[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const id = Number(input.id);
  const status = input.action === "approve" ? "approved" : "denied";
  const db = await getDb();
  const result = await db.update(ptoRequests).set({ status, reviewedBy: actor.email, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(ptoRequests.id, id)).returning();
  if (!result[0]) return Response.json({ error: "Request not found." }, { status: 404 });
  await logActivity(actor, `pto.${status}`, "pto_request", id, `${status === "approved" ? "Approved" : "Denied"} PTO request #${id}.`);
  return Response.json({ request: result[0] });
}
