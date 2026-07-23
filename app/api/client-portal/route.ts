import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { getTestAccessSession, logActivity, requireAccess, isAccessResponse } from "@/db/access";
import {
  billingDocuments, clientProjects, employees, fileRequests, leads,
  payments, projectFiles, projectMessages, projectTasks, projectUpdates,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function authorize(leadId: number) {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { error: Response.json({ error: "Customer not found." }, { status: 404 }) };
  const [employee] = await db.select().from(employees).where(eq(employees.email, user.email.toLowerCase())).limit(1);
  const bootstrapOwner = user.email.toLowerCase() === "mhutchi2517@gmail.com";
  const actualRole = employee?.role || (bootstrapOwner ? "owner" : "");
  const testSession = actualRole === "owner" ? await getTestAccessSession(user.email.toLowerCase()) : null;
  if (testSession?.mode === "client" && testSession.leadId !== leadId) {
    return { error: Response.json({ error: "This test client session is linked to a different customer." }, { status: 403 }) };
  }
  const testClient = testSession?.mode === "client" && testSession.leadId === leadId;
  const isClient = lead.email.toLowerCase() === user.email.toLowerCase() || testClient;
  if (!employee && !bootstrapOwner && !isClient) {
    return { error: Response.json({ error: "This project is not connected to your account." }, { status: 403 }) };
  }
  return {
    db, lead, user,
    isStaff: Boolean(employee || bootstrapOwner) && !testClient,
    role: testClient ? "client" : employee?.role || (bootstrapOwner ? "owner" : "client"),
    testClient,
  };
}

async function ensureProject(leadId: number) {
  const db = await getDb();
  let [project] = await db.select().from(clientProjects).where(eq(clientProjects.leadId, leadId)).limit(1);
  if (!project) {
    const now = new Date().toISOString();
    [project] = await db.insert(clientProjects).values({
      leadId, createdAt: now, updatedAt: now,
      clientSummary: "Your project is organized and ready for the next step.",
    }).returning();
    const actor = await requireAccess();
    if (!isAccessResponse(actor)) await logActivity(actor, "project.portal.created", "project", project.id, `Created client portal for lead #${leadId}.`);
  }
  return project;
}

export async function GET(request: Request) {
  const leadId = Number(new URL(request.url).searchParams.get("leadId"));
  if (!leadId) return Response.json({ error: "A customer is required." }, { status: 400 });
  const access = await authorize(leadId);
  if ("error" in access) return access.error;
  const project = await ensureProject(leadId);
  const [updates, requests, files, billing, messages, tasks] = await Promise.all([
    access.db.select().from(projectUpdates).where(eq(projectUpdates.projectId, project.id)).orderBy(desc(projectUpdates.createdAt)),
    access.db.select().from(fileRequests).where(eq(fileRequests.projectId, project.id)).orderBy(desc(fileRequests.createdAt)),
    access.db.select().from(projectFiles).where(eq(projectFiles.projectId, project.id)).orderBy(desc(projectFiles.createdAt)),
    access.db.select().from(billingDocuments).where(eq(billingDocuments.leadId, leadId)).orderBy(desc(billingDocuments.createdAt)),
    access.db.select().from(projectMessages).where(eq(projectMessages.projectId, project.id)).orderBy(projectMessages.createdAt),
    access.db.select().from(projectTasks).where(eq(projectTasks.projectId, project.id)).orderBy(projectTasks.createdAt),
  ]);
  const paymentHistory = billing.length
    ? await access.db.select().from(payments)
        .where(inArray(payments.billingDocumentId, billing.map(document => document.id)))
        .orderBy(desc(payments.paidAt))
    : [];
  return Response.json({
    viewer: { name: access.user.displayName, email: access.user.email, role: access.role, isStaff: access.isStaff, testClient: access.testClient },
    customer: access.lead, project,
    updates: access.isStaff ? updates : updates.filter(item => item.visibleToClient),
    requests,
    files: access.isStaff ? files : files.filter(item => item.visibleToClient),
    billing,
    payments: paymentHistory,
    messages,
    tasks: access.isStaff ? tasks : tasks.filter(item => item.visibleToClient),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const leadId = Number(form.get("leadId"));
    const access = await authorize(leadId);
    if ("error" in access) return access.error;
    const project = await ensureProject(leadId);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Files must be 25 MB or smaller." }, { status: 400 });
    const requestId = Number(form.get("requestId")) || null;
    if (requestId) {
      const [matchingRequest] = await access.db.select().from(fileRequests)
        .where(and(eq(fileRequests.id, requestId), eq(fileRequests.projectId, project.id))).limit(1);
      if (!matchingRequest) return Response.json({ error: "That file request is not part of this project." }, { status: 400 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
    const storageKey = `projects/${project.id}/${crypto.randomUUID()}-${safeName}`;
    const { env } = await import("cloudflare:workers");
    await env.BUCKET.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    const now = new Date().toISOString();
    const [saved] = await access.db.insert(projectFiles).values({
      projectId: project.id, requestId,
      uploadedByEmail: access.user.email.toLowerCase(),
      uploadedByName: access.user.displayName,
      filename: file.name, storageKey,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      category: String(form.get("category") || "other"),
      caption: String(form.get("caption") || ""),
      visibleToClient: true,
      createdAt: now,
    }).returning();
    if (requestId) {
      await access.db.update(fileRequests).set({ status: "received", updatedAt: now }).where(eq(fileRequests.id, requestId));
    }
    return Response.json({ file: saved });
  }

  const body = await request.json();
  const leadId = Number(body.leadId);
  const access = await authorize(leadId);
  if ("error" in access) return access.error;
  const project = await ensureProject(leadId);
  const now = new Date().toISOString();
  if (body.action === "sendMessage") {
    const message = String(body.message || "").trim().slice(0, 4000);
    if (!message) return Response.json({ error: "Write a message before sending." }, { status: 400 });
    const [savedMessage] = await access.db.insert(projectMessages).values({
      projectId: project.id,
      senderEmail: access.user.email.toLowerCase(),
      senderName: access.user.displayName,
      senderType: access.isStaff ? "staff" : "client",
      message,
      createdAt: now,
    }).returning();
    if (access.isStaff) {
      const actor = await requireAccess();
      if (!isAccessResponse(actor)) await logActivity(actor, "client.message_sent", "project", project.id, `Sent a message to ${access.lead.business}.`);
    }
    return Response.json({ ok: true, message: savedMessage });
  }
  if (!access.isStaff || !["owner", "admin", "sales", "support"].includes(access.role)) {
    return Response.json({ error: "Only authorized employees can update project details." }, { status: 403 });
  }
  if (body.action === "updateProject") {
    await access.db.update(clientProjects).set({
      status: String(body.status || project.status),
      progress: Math.max(0, Math.min(100, Number(body.progress) || 0)),
      currentPhase: String(body.currentPhase || ""),
      nextStep: String(body.nextStep || ""),
      targetDate: body.targetDate || null,
      clientSummary: String(body.clientSummary || ""),
      updatedAt: now,
    }).where(eq(clientProjects.id, project.id));
  } else if (body.action === "addUpdate") {
    await access.db.insert(projectUpdates).values({
      projectId: project.id,
      title: String(body.title || "Project update"),
      message: String(body.message || ""),
      visibleToClient: body.visibleToClient !== false,
      createdBy: access.user.email,
      createdAt: now,
    });
  } else if (body.action === "requestFile") {
    await access.db.insert(fileRequests).values({
      projectId: project.id,
      title: String(body.title || "Requested file"),
      description: String(body.description || ""),
      category: String(body.category || "other"),
      required: body.required !== false,
      dueDate: body.dueDate || null,
      createdBy: access.user.email,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }
  const actor = await requireAccess();
  if (!isAccessResponse(actor)) await logActivity(actor, `client.${body.action}`, "project", project.id, `Updated the client portal for ${access.lead.business}.`);
  return Response.json({ ok: true });
}
