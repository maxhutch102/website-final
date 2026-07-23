import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { employees, timeEntries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const query = db.select({
    id: timeEntries.id, employeeId: timeEntries.employeeId, firstName: employees.firstName,
    lastName: employees.lastName, clockIn: timeEntries.clockIn, clockOut: timeEntries.clockOut,
    breakMinutes: timeEntries.breakMinutes, breakStartedAt: timeEntries.breakStartedAt,
    status: timeEntries.status, note: timeEntries.note,
    correctionClockIn: timeEntries.correctionClockIn, correctionClockOut: timeEntries.correctionClockOut,
    correctionReason: timeEntries.correctionReason, correctionStatus: timeEntries.correctionStatus,
  }).from(timeEntries).leftJoin(employees, eq(timeEntries.employeeId, employees.id));
  const entries = ["owner", "admin"].includes(actor.role)
    ? await query.orderBy(desc(timeEntries.clockIn)).limit(100)
    : actor.employeeId
      ? await query.where(eq(timeEntries.employeeId, actor.employeeId)).orderBy(desc(timeEntries.clockIn)).limit(100)
      : [];
  return Response.json({ entries });
}

export async function POST(request: Request) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const employeeId = actor.role === "owner" || actor.role === "admin" ? Number(input.employeeId || actor.employeeId) : Number(actor.employeeId);
  if (!employeeId) return Response.json({ error: "Choose an employee first." }, { status: 400 });
  const db = await getDb();
  const active = await db.select().from(timeEntries)
    .where(eq(timeEntries.employeeId, employeeId)).orderBy(desc(timeEntries.clockIn)).limit(1);
  if (active[0] && !active[0].clockOut) return Response.json({ error: "This employee is already clocked in." }, { status: 409 });
  const now = new Date().toISOString();
  const result = await db.insert(timeEntries).values({
    employeeId, clockIn: now, clockOut: null, breakMinutes: 0, status: "open",
    note: "", createdAt: now, updatedAt: now,
  }).returning();
  await logActivity(actor, "time.clock_in", "time_entry", result[0].id, `Clocked in employee #${employeeId}.`);
  return Response.json({ entry: result[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const id = Number(input.id);
  if (!id) return Response.json({ error: "Time entry id is required." }, { status: 400 });
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const db = await getDb();
  const existing = await db.select().from(timeEntries).where(eq(timeEntries.id, id)).limit(1);
  if (!existing[0]) return Response.json({ error: "Time entry not found." }, { status: 404 });
  const manager = actor.role === "owner" || actor.role === "admin";
  if (!manager && existing[0].employeeId !== actor.employeeId) return Response.json({ error: "You can only update your own time." }, { status: 403 });
  if (["approve", "reopen", "applyCorrection"].includes(input.action) && !manager) return Response.json({ error: "Manager access required." }, { status: 403 });
  if (input.action === "clockOut") {
    patch.clockOut = new Date().toISOString();
    patch.breakStartedAt = null;
  }
  if (input.action === "startBreak") patch.breakStartedAt = new Date().toISOString();
  if (input.action === "endBreak") {
    if (!existing[0].breakStartedAt) return Response.json({ error: "No break is currently active." }, { status: 409 });
    patch.breakMinutes = existing[0].breakMinutes + Math.max(1, Math.round((Date.now() - new Date(existing[0].breakStartedAt).getTime()) / 60000));
    patch.breakStartedAt = null;
  }
  if (input.action === "approve") {
    patch.status = "approved"; patch.approvedBy = actor.email;
    patch.approvedAt = new Date().toISOString();
  }
  if (input.action === "reopen") { patch.status = "open"; patch.approvedBy = null; patch.approvedAt = null; }
  if ("breakMinutes" in input) patch.breakMinutes = Math.max(0, Number(input.breakMinutes));
  if ("note" in input) patch.note = String(input.note || "");
  if (input.action === "requestCorrection") {
    patch.correctionClockIn = input.clockIn ? new Date(input.clockIn).toISOString() : existing[0].clockIn;
    patch.correctionClockOut = input.clockOut ? new Date(input.clockOut).toISOString() : existing[0].clockOut;
    patch.correctionReason = String(input.reason || "");
    patch.correctionStatus = "pending";
  }
  if (input.action === "applyCorrection") {
    patch.clockIn = existing[0].correctionClockIn || existing[0].clockIn;
    patch.clockOut = existing[0].correctionClockOut || existing[0].clockOut;
    patch.correctionStatus = "approved";
    patch.status = "open";
  }
  if (input.action === "denyCorrection") {
    if (!manager) return Response.json({ error: "Manager access required." }, { status: 403 });
    patch.correctionStatus = "denied";
  }
  const result = await db.update(timeEntries).set(patch).where(eq(timeEntries.id, id)).returning();
  await logActivity(actor, `time.${String(input.action || "updated")}`, "time_entry", id, `${String(input.action || "Updated")} time entry #${id}.`);
  return Response.json({ entry: result[0] });
}
