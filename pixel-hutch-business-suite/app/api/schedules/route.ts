import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { employees, schedules } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const rows = await db.select({
    id: schedules.id, employeeId: schedules.employeeId, firstName: employees.firstName,
    lastName: employees.lastName, shiftDate: schedules.shiftDate, startTime: schedules.startTime,
    endTime: schedules.endTime, location: schedules.location, note: schedules.note,
  }).from(schedules).leftJoin(employees, eq(schedules.employeeId, employees.id)).orderBy(asc(schedules.shiftDate));
  return Response.json({ schedules: actor.role === "owner" || actor.role === "admin" ? rows : rows.filter(row => row.employeeId === actor.employeeId) });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  if (!input.employeeId || !input.shiftDate || !input.startTime || !input.endTime) return Response.json({ error: "Employee, date, and times are required." }, { status: 400 });
  const now = new Date().toISOString();
  const db = await getDb();
  const result = await db.insert(schedules).values({
    employeeId: Number(input.employeeId), shiftDate: String(input.shiftDate), startTime: String(input.startTime),
    endTime: String(input.endTime), location: String(input.location || "Remote"), note: String(input.note || ""),
    createdBy: actor.email, createdAt: now, updatedAt: now,
  }).returning();
  await logActivity(actor, "schedule.created", "schedule", result[0].id, `Scheduled employee #${result[0].employeeId} for ${result[0].shiftDate}.`);
  return Response.json({ schedule: result[0] }, { status: 201 });
}
