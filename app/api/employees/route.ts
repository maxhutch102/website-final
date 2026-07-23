import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  return Response.json({ employees: await db.select().from(employees).orderBy(asc(employees.lastName)) });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const allowedRoles = ["owner", "admin", "manager", "sales", "support", "employee"];
  if (!input.email || !input.firstName || !input.lastName || !input.startDate) {
    return Response.json({ error: "Name, email, and start date are required." }, { status: 400 });
  }
  if (!allowedRoles.includes(String(input.role || "employee"))) return Response.json({ error: "Choose a valid access role." }, { status: 400 });
  const now = new Date().toISOString();
  const db = await getDb();
  const result = await db.insert(employees).values({
    email: String(input.email).trim().toLowerCase(), firstName: String(input.firstName).trim(),
    lastName: String(input.lastName).trim(), preferredName: "", phone: "",
    jobTitle: String(input.jobTitle || "").trim(), department: String(input.department || "General"),
    role: String(input.role || "employee"), employmentType: String(input.employmentType || "hourly"),
    payRateCents: Math.max(0, Number(input.payRateCents || 0)), payFrequency: String(input.payFrequency || "biweekly"),
    startDate: String(input.startDate), status: "active", emergencyName: "", emergencyPhone: "",
    emergencyRelation: "", address: "", taxFormsComplete: false, directDepositComplete: false,
    handbookComplete: false, ptoMinutes: 0, sickMinutes: 0, createdAt: now, updatedAt: now,
  }).returning();
  await logActivity(actor, "employee.created", "employee", result[0].id, `Created employee profile for ${result[0].firstName} ${result[0].lastName}.`);
  return Response.json({ employee: result[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const input = await request.json();
  const id = Number(input.id);
  if (!id) return Response.json({ error: "Employee id is required." }, { status: 400 });
  if ("role" in input && !["owner", "admin", "manager", "sales", "support", "employee"].includes(String(input.role))) {
    return Response.json({ error: "Choose a valid access role." }, { status: 400 });
  }
  const allowed = [
    "firstName", "lastName", "preferredName", "phone", "jobTitle", "department", "role",
    "employmentType", "payRateCents", "payFrequency", "startDate", "status", "emergencyName",
    "emergencyPhone", "emergencyRelation", "address", "taxFormsComplete",
    "directDepositComplete", "handbookComplete", "ptoMinutes", "sickMinutes",
  ] as const;
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) if (key in input) patch[key] = input[key];
  const db = await getDb();
  const result = await db.update(employees).set(patch).where(eq(employees.id, id)).returning();
  if (!result[0]) return Response.json({ error: "Employee not found." }, { status: 404 });
  const changed = allowed.filter(key => key in input).join(", ");
  await logActivity(actor, "employee.updated", "employee", id, `Updated ${result[0].firstName} ${result[0].lastName}: ${changed}.`);
  return Response.json({ employee: result[0] });
}
