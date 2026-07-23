import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { billingDocuments, clientProjects, employees, leads, projectFiles, projectTasks, projectTemplates } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const defaultTemplates = [
  {
    name: "Business website",
    description: "A repeatable website delivery plan from kickoff through launch.",
    tasks: [
      ["Kickoff & discovery", "Confirm goals, audience, scope, and success measures.", "Discovery"],
      ["Collect content & assets", "Gather logo, photos, services, contact details, and required copy.", "Discovery"],
      ["Create page structure", "Approve pages, navigation, and calls to action.", "Planning"],
      ["Build first version", "Create the initial responsive website.", "Build"],
      ["Internal quality check", "Review mobile, links, forms, accessibility, and content.", "Quality assurance"],
      ["Client review", "Share the build and collect consolidated feedback.", "Client review"],
      ["Launch & handoff", "Connect the domain, publish, and provide handoff details.", "Launch"],
    ],
  },
  {
    name: "Business system / CRM",
    description: "A practical workflow for internal tools, portals, and custom systems.",
    tasks: [
      ["Workflow discovery", "Document the current process, users, pain points, and permissions.", "Discovery"],
      ["Data & access plan", "Define records, roles, security rules, and integrations.", "Planning"],
      ["Build core workflow", "Implement the primary records and daily-use actions.", "Build"],
      ["Team review", "Test the workflow with realistic business scenarios.", "Quality assurance"],
      ["Training & launch", "Prepare employees, documentation, and production access.", "Launch"],
    ],
  },
  {
    name: "On-site IT setup",
    description: "A field-service checklist for equipment, networks, printers, and handoff.",
    tasks: [
      ["Confirm site requirements", "Document equipment, users, access, and arrival details.", "Planning"],
      ["Prepare equipment", "Configure and label equipment before installation.", "Preparation"],
      ["Install & connect", "Complete the approved on-site setup.", "Installation"],
      ["Test with customer", "Verify access, printing, network, backups, and user workflow.", "Quality assurance"],
      ["Document & hand off", "Record configuration and provide customer instructions.", "Handoff"],
    ],
  },
];

async function ensureDefaults(db: Awaited<ReturnType<typeof getDb>>, actorEmail: string) {
  const existing = await db.select().from(projectTemplates).limit(1);
  if (existing.length) return;
  const now = new Date().toISOString();
  await db.insert(projectTemplates).values(defaultTemplates.map(template => ({
    name: template.name,
    description: template.description,
    tasksJson: JSON.stringify(template.tasks.map(([title, description, milestone]) => ({ title, description, milestone }))),
    createdBy: actorEmail,
    createdAt: now,
    updatedAt: now,
  })));
}

export async function GET() {
  const actor = await requireAccess(["owner", "admin", "sales", "support", "employee"]);
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  await ensureDefaults(db, actor.email);
  const [projects, tasks, templates, people, customers, billing, files] = await Promise.all([
    db.select().from(clientProjects).orderBy(asc(clientProjects.createdAt)),
    db.select().from(projectTasks).orderBy(asc(projectTasks.createdAt)),
    db.select().from(projectTemplates).where(eq(projectTemplates.active, true)).orderBy(asc(projectTemplates.name)),
    db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, status: employees.status }).from(employees),
    db.select().from(leads),
    db.select().from(billingDocuments),
    db.select().from(projectFiles).orderBy(desc(projectFiles.createdAt)),
  ]);
  const assignedOnly = ["employee", "support"].includes(actor.role);
  const allowedProjects = assignedOnly
    ? projects.filter(project => actor.employeeId && tasks.some(task => task.projectId === project.id && task.assignedEmployeeId === actor.employeeId))
    : projects;
  const allowedIds = allowedProjects.map(project => project.id);
  const allowedLeadIds = allowedProjects.map(project => project.leadId);
  const allowedTasks = assignedOnly
    ? tasks.filter(task => allowedIds.includes(task.projectId) && task.assignedEmployeeId === actor.employeeId)
    : tasks.filter(task => allowedIds.includes(task.projectId));
  return Response.json({
    projects: allowedProjects,
    tasks: allowedTasks,
    templates: assignedOnly ? [] : templates,
    employees: assignedOnly ? people.filter(person => person.id === actor.employeeId) : people.filter(person => person.status === "active"),
    customers: assignedOnly ? customers.filter(customer => allowedLeadIds.includes(customer.id)) : customers,
    billing: assignedOnly ? [] : billing,
    files: allowedIds.length ? files.filter(file => allowedIds.includes(file.projectId)) : [],
  });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin", "sales", "support"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const db = await getDb();
  const now = new Date().toISOString();

  if (body.action === "createProject") {
    const leadId = Number(body.leadId);
    if (!leadId) return Response.json({ error: "Choose a customer." }, { status: 400 });
    let [project] = await db.select().from(clientProjects).where(eq(clientProjects.leadId, leadId)).limit(1);
    if (!project) {
      [project] = await db.insert(clientProjects).values({
        leadId,
        status: String(body.status || "planning"),
        progress: 0,
        currentPhase: String(body.currentPhase || "Planning & discovery"),
        nextStep: String(body.nextStep || "Confirm project requirements"),
        targetDate: body.targetDate || null,
        clientSummary: String(body.clientSummary || "Your project is organized and ready for the next step."),
        createdAt: now,
        updatedAt: now,
      }).returning();
    }
    const templateId = Number(body.templateId);
    if (templateId) {
      const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, templateId)).limit(1);
      if (template) {
        const templateTasks = JSON.parse(template.tasksJson) as Array<{ title:string; description:string; milestone:string }>;
        if (templateTasks.length) await db.insert(projectTasks).values(templateTasks.map(task => ({
          projectId: project.id,
          title: task.title,
          description: task.description || "",
          milestone: task.milestone || "General",
          createdBy: actor.email,
          createdAt: now,
          updatedAt: now,
        })));
      }
    }
    await logActivity(actor, "project.created", "project", project.id, `Created project for customer #${leadId}.`);
    return GET();
  }

  if (body.action === "createTask") {
    const projectId = Number(body.projectId);
    if (!projectId || !String(body.title || "").trim()) return Response.json({ error: "Project and task title are required." }, { status: 400 });
    const [task] = await db.insert(projectTasks).values({
      projectId,
      title: String(body.title).trim(),
      description: String(body.description || ""),
      milestone: String(body.milestone || "General"),
      status: String(body.status || "todo"),
      priority: String(body.priority || "normal"),
      assignedEmployeeId: body.assignedEmployeeId ? Number(body.assignedEmployeeId) : null,
      dueDate: body.dueDate || null,
      visibleToClient: Boolean(body.visibleToClient),
      clientApprovalRequired: Boolean(body.clientApprovalRequired),
      createdBy: actor.email,
      createdAt: now,
      updatedAt: now,
    }).returning();
    await logActivity(actor, "task.created", "task", task.id, `Created task “${task.title}”.`);
    return GET();
  }

  if (body.action === "applyTemplate") {
    const projectId = Number(body.projectId);
    const templateId = Number(body.templateId);
    const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, templateId)).limit(1);
    if (!projectId || !template) return Response.json({ error: "Project template not found." }, { status: 404 });
    const templateTasks = JSON.parse(template.tasksJson) as Array<{ title:string; description:string; milestone:string }>;
    await db.insert(projectTasks).values(templateTasks.map(task => ({
      projectId,
      title: task.title,
      description: task.description || "",
      milestone: task.milestone || "General",
      createdBy: actor.email,
      createdAt: now,
      updatedAt: now,
    })));
    await logActivity(actor, "project.template_applied", "project", projectId, `Applied project template “${template.name}”.`);
    return GET();
  }

  return Response.json({ error: "Unknown project action." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin", "sales", "support", "employee"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const db = await getDb();
  const now = new Date().toISOString();

  if (body.action === "updateProject") {
    if (!["owner", "admin", "sales", "support"].includes(actor.role)) return Response.json({ error: "You cannot edit project settings." }, { status: 403 });
    const id = Number(body.id);
    const patch = {
      status: String(body.status || "planning"),
      currentPhase: String(body.currentPhase || ""),
      nextStep: String(body.nextStep || ""),
      targetDate: body.targetDate || null,
      clientSummary: String(body.clientSummary || ""),
      updatedAt: now,
    };
    await db.update(clientProjects).set(patch).where(eq(clientProjects.id, id));
    await logActivity(actor, "project.updated", "project", id, `Updated project status to ${patch.status}.`);
  } else if (body.action === "updateTask") {
    const id = Number(body.id);
    const [current] = await db.select().from(projectTasks).where(eq(projectTasks.id, id)).limit(1);
    if (!current) return Response.json({ error: "Task not found." }, { status: 404 });
    if (actor.role === "employee" && current.assignedEmployeeId !== actor.employeeId) return Response.json({ error: "You can only update tasks assigned to you." }, { status: 403 });
    const status = String(body.status || current.status);
    await db.update(projectTasks).set({
      title: body.title === undefined ? current.title : String(body.title),
      description: body.description === undefined ? current.description : String(body.description),
      milestone: body.milestone === undefined ? current.milestone : String(body.milestone),
      status,
      priority: body.priority === undefined ? current.priority : String(body.priority),
      assignedEmployeeId: body.assignedEmployeeId === undefined ? current.assignedEmployeeId : (body.assignedEmployeeId ? Number(body.assignedEmployeeId) : null),
      dueDate: body.dueDate === undefined ? current.dueDate : (body.dueDate || null),
      visibleToClient: body.visibleToClient === undefined ? current.visibleToClient : Boolean(body.visibleToClient),
      clientApprovalRequired: body.clientApprovalRequired === undefined ? current.clientApprovalRequired : Boolean(body.clientApprovalRequired),
      completedAt: status === "done" ? (current.completedAt || now) : null,
      updatedAt: now,
    }).where(eq(projectTasks.id, id));
    const projectTaskList = await db.select().from(projectTasks).where(eq(projectTasks.projectId, current.projectId));
    const completed = projectTaskList.filter(task => (task.id === id ? status : task.status) === "done").length;
    const progress = projectTaskList.length ? Math.round(completed / projectTaskList.length * 100) : 0;
    await db.update(clientProjects).set({ progress, updatedAt: now }).where(eq(clientProjects.id, current.projectId));
    await logActivity(actor, "task.updated", "task", id, `Updated task “${current.title}” to ${status}.`);
  } else {
    return Response.json({ error: "Unknown project update." }, { status: 400 });
  }
  return GET();
}
