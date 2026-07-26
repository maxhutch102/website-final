import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import {
  billingDocuments, calendarEvents, clientProjects, employees, leads, notificationStates,
  projectTasks, ptoRequests, schedules,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type TimelineItem = {
  key:string; source:string; sourceId:number; title:string; start:string; end:string|null;
  allDay:boolean; type:string; detail:string; status:string; leadId?:number|null;
  projectId?:number|null; employeeId?:number|null; read?:boolean;
};

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const [events, shifts, timeOff, tasks, projects, customers, billing, people, states] = await Promise.all([
    db.select().from(calendarEvents),
    db.select().from(schedules),
    db.select().from(ptoRequests),
    db.select().from(projectTasks),
    db.select().from(clientProjects),
    db.select().from(leads),
    db.select().from(billingDocuments),
    db.select().from(employees),
    db.select().from(notificationStates).where(eq(notificationStates.employeeEmail, actor.email)),
  ]);
  const manager = ["owner","admin"].includes(actor.role);
  const visibleEvents = events.filter(event => manager || event.visibility === "team" || event.assignedEmployeeId === actor.employeeId);
  const visibleShifts = shifts.filter(shift => manager || shift.employeeId === actor.employeeId);
  const visiblePto = timeOff.filter(request => request.status === "approved" && (manager || request.employeeId === actor.employeeId));
  const visibleTasks = tasks.filter(task => manager || task.assignedEmployeeId === actor.employeeId);
  const customerName = (id:number|null) => customers.find(customer => customer.id === id)?.business || "Customer";
  const employeeName = (id:number|null) => {
    const person = people.find(employee => employee.id === id);
    return person ? `${person.preferredName || person.firstName} ${person.lastName}` : "Employee";
  };
  const timeline:TimelineItem[] = [
    ...visibleEvents.map(event => ({ key:`event:${event.id}`, source:"event", sourceId:event.id, title:event.title, start:event.startAt, end:event.endAt, allDay:event.allDay, type:event.eventType, detail:event.location || event.note, status:event.status, leadId:event.leadId, projectId:event.projectId, employeeId:event.assignedEmployeeId })),
    ...visibleShifts.map(shift => ({ key:`shift:${shift.id}`, source:"shift", sourceId:shift.id, title:`${employeeName(shift.employeeId)} · shift`, start:`${shift.shiftDate}T${shift.startTime}`, end:`${shift.shiftDate}T${shift.endTime}`, allDay:false, type:"shift", detail:shift.location, status:"scheduled", employeeId:shift.employeeId })),
    ...visiblePto.map(request => ({ key:`pto:${request.id}`, source:"pto", sourceId:request.id, title:`${employeeName(request.employeeId)} · ${request.type.toUpperCase()}`, start:request.startDate, end:request.endDate, allDay:true, type:"pto", detail:request.reason, status:request.status, employeeId:request.employeeId })),
    ...visibleTasks.filter(task => task.dueDate).map(task => ({ key:`task:${task.id}`, source:"task", sourceId:task.id, title:task.title, start:task.dueDate!, end:null, allDay:true, type:"task", detail:`${task.milestone} · ${task.priority}`, status:task.status, projectId:task.projectId, employeeId:task.assignedEmployeeId })),
    ...projects.filter(project => project.targetDate).map(project => ({ key:`project:${project.id}`, source:"project", sourceId:project.id, title:`${customerName(project.leadId)} · project target`, start:project.targetDate!, end:null, allDay:true, type:"project", detail:project.currentPhase, status:project.status, leadId:project.leadId, projectId:project.id })),
    ...customers.filter(customer => customer.nextFollowUp).map(customer => ({ key:`followup:${customer.id}`, source:"customer", sourceId:customer.id, title:`Follow up · ${customer.business}`, start:customer.nextFollowUp!, end:null, allDay:true, type:"follow_up", detail:customer.name, status:customer.status, leadId:customer.id })),
    ...billing.filter(document => document.dueDate && document.status !== "paid" && document.status !== "void").map(document => ({ key:`billing:${document.id}`, source:"billing", sourceId:document.id, title:`${document.number} due · ${document.customerBusiness || document.customerName}`, start:document.dueDate!, end:null, allDay:true, type:"billing", detail:`$${(Math.max(0,document.totalCents-document.paidCents)/100).toFixed(2)} outstanding`, status:document.status, leadId:document.leadId })),
  ].sort((a,b) => a.start.localeCompare(b.start));
  const stateMap = new Map(states.map(state => [state.notificationKey, state]));
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86400000);
  const notifications = timeline.filter(item => {
    if (["done","complete","paid","void","canceled"].includes(item.status)) return false;
    const date = new Date(item.start.length === 10 ? `${item.start}T23:59:59` : item.start);
    return date <= horizon;
  }).map(item => {
    const state = stateMap.get(item.key);
    const date = new Date(item.start.length === 10 ? `${item.start}T23:59:59` : item.start);
    return { ...item, read:Boolean(state?.readAt), dismissed:Boolean(state?.dismissedAt), urgency:date < now ? "overdue" : "upcoming" };
  }).filter(item => !item.dismissed);
  return Response.json({ timeline, notifications });
}

export async function POST(request:Request) {
  const actor = await requireAccess(["owner","admin"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  if (!String(body.title || "").trim() || !body.startAt) return Response.json({error:"Title and start are required."},{status:400});
  const now = new Date().toISOString();
  const db = await getDb();
  const [event] = await db.insert(calendarEvents).values({
    title:String(body.title).trim(), eventType:String(body.eventType || "appointment"), startAt:String(body.startAt),
    endAt:body.endAt ? String(body.endAt) : null, allDay:Boolean(body.allDay), location:String(body.location || ""),
    note:String(body.note || ""), leadId:body.leadId ? Number(body.leadId) : null, projectId:body.projectId ? Number(body.projectId) : null,
    assignedEmployeeId:body.assignedEmployeeId ? Number(body.assignedEmployeeId) : null,
    visibility:String(body.visibility || "team"), status:"scheduled", createdBy:actor.email, createdAt:now, updatedAt:now,
  }).returning();
  await logActivity(actor,"calendar.event_created","calendar_event",event.id,`Created calendar event “${event.title}”.`);
  return Response.json({event},{status:201});
}

export async function PATCH(request:Request) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  if (!body.key || !["read","dismiss"].includes(body.action)) return Response.json({error:"Notification key and action are required."},{status:400});
  const db = await getDb();
  const existing = await db.select().from(notificationStates).where(and(eq(notificationStates.employeeEmail,actor.email),eq(notificationStates.notificationKey,String(body.key)))).limit(1);
  const now = new Date().toISOString();
  const patch = body.action === "read" ? {readAt:now,updatedAt:now} : {dismissedAt:now,updatedAt:now};
  if (existing[0]) await db.update(notificationStates).set(patch).where(eq(notificationStates.id,existing[0].id));
  else await db.insert(notificationStates).values({employeeEmail:actor.email,notificationKey:String(body.key),readAt:body.action === "read" ? now : null,dismissedAt:body.action === "dismiss" ? now : null,createdAt:now,updatedAt:now});
  return Response.json({ok:true});
}
