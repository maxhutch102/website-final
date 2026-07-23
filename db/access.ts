import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { activityLogs, employees, testAccessSessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

export type AccessContext = {
  email: string;
  name: string;
  role: string;
  employeeId: number | null;
  actualRole: string;
  testMode: null | { mode: string; role: string | null; leadId: number | null };
};

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function getTestAccessSession(ownerEmail: string) {
  const token = (await cookies()).get("ph_test_access")?.value;
  if (!token) return null;
  const db = await getDb();
  const [session] = await db.select().from(testAccessSessions).where(and(
    eq(testAccessSessions.tokenHash, await hashToken(token)),
    eq(testAccessSessions.ownerEmail, ownerEmail),
    gt(testAccessSessions.expiresAt, new Date().toISOString()),
  )).limit(1);
  return session || null;
}

export async function requireAccess(roles?: string[]): Promise<AccessContext | Response> {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const match = await db.select().from(employees).where(eq(employees.email, user.email.toLowerCase())).limit(1);
  const employee = match[0];
  const isBootstrapOwner = user.email.toLowerCase() === "mhutchi2517@gmail.com";
  if (!employee && !isBootstrapOwner) {
    return Response.json({ error: "You do not have employee access." }, { status: 403 });
  }
  const actualRole = employee?.role || "owner";
  if (employee && employee.status !== "active") return Response.json({ error: "Employee access is inactive." }, { status: 403 });
  const testSession = actualRole === "owner" ? await getTestAccessSession(user.email.toLowerCase()) : null;
  if (testSession?.mode === "client") {
    return Response.json({ error: "Test client mode cannot access the employee workspace. Return to Owner first." }, { status: 403 });
  }
  const role = testSession?.mode === "role" && testSession.role ? testSession.role : actualRole;
  if (roles && !roles.includes(role)) return Response.json({ error: "You do not have permission for this action." }, { status: 403 });
  return {
    email: user.email.toLowerCase(),
    name: employee ? `${employee.preferredName || employee.firstName} ${employee.lastName}` : user.displayName,
    role,
    employeeId: employee?.id || null,
    actualRole,
    testMode: testSession ? { mode: testSession.mode, role: testSession.role, leadId: testSession.leadId } : null,
  };
}

export function isAccessResponse(value: AccessContext | Response): value is Response {
  return value instanceof Response;
}

export async function logActivity(actor: AccessContext, action: string, entityType: string, entityId: string | number | null, summary: string) {
  const db = await getDb();
  await db.insert(activityLogs).values({
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId: entityId == null ? "" : String(entityId),
    summary,
    createdAt: new Date().toISOString(),
  });
}
