"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Lead = {
  id: number; name: string; business: string; email: string; phone: string; project: string;
  budget: string; timeline: string; referral: string; message: string; status: string;
  estimatedValue: number; nextFollowUp: string | null; notes: string; createdAt: string; updatedAt: string;
};
type Employee = {
  id: number; email: string; firstName: string; lastName: string; preferredName: string;
  jobTitle: string; department: string; role: string; employmentType: string; payRateCents: number;
  payFrequency: string; startDate: string; status: string; taxFormsComplete: boolean;
  directDepositComplete: boolean; handbookComplete: boolean;
  ptoMinutes: number; sickMinutes: number;
};
type TimeEntry = {
  id: number; employeeId: number; firstName: string; lastName: string; clockIn: string;
  clockOut: string | null; breakMinutes: number; breakStartedAt: string | null; status: string; note: string;
  correctionClockIn: string | null; correctionClockOut: string | null; correctionReason: string; correctionStatus: string;
};
type TestMode = { mode: string; role: string | null; leadId: number | null };
type Actor = { email: string; name: string; role: string; employeeId: number | null; actualRole?: string; testMode?: TestMode | null };
type PtoRequest = { id:number; employeeId:number; firstName:string; lastName:string; type:string; startDate:string; endDate:string; minutes:number; reason:string; status:string; createdAt:string };
type Schedule = { id:number; employeeId:number; firstName:string; lastName:string; shiftDate:string; startTime:string; endTime:string; location:string; note:string };
type CalendarItem = { key:string; source:string; sourceId:number; title:string; start:string; end:string|null; allDay:boolean; type:string; detail:string; status:string; leadId?:number|null; projectId?:number|null; employeeId?:number|null };
type HubNotification = CalendarItem & { read:boolean; dismissed:boolean; urgency:"overdue"|"upcoming" };
type Activity = { id:number; actorName:string; actorEmail:string; actorRole:string; action:string; entityType:string; summary:string; createdAt:string };
type BillingDocument = { id:number; kind:string; number:string; leadId:number|null; customerName:string; customerBusiness:string; customerEmail:string; status:string; issueDate:string; dueDate:string|null; lineItemsJson:string; subtotalCents:number; discountCents:number; taxCents:number; totalCents:number; paidCents:number; recurring:boolean; recurrence:string; notes:string };
type BillingCategory = "open" | "estimates" | "closed" | "canceled";
type BillingSortKey = "number" | "customer" | "issueDate" | "dueDate" | "total" | "status";
type ProjectMessage = { id:number; senderName:string; senderType:string; message:string; createdAt:string };
type Project = { id:number; leadId:number; status:string; progress:number; currentPhase:string; nextStep:string; targetDate:string|null; clientSummary:string };
type ProjectTask = { id:number; projectId:number; title:string; description:string; milestone:string; status:string; priority:string; assignedEmployeeId:number|null; dueDate:string|null; visibleToClient:boolean; clientApprovalRequired:boolean; completedAt:string|null };
type ProjectTemplate = { id:number; name:string; description:string; tasksJson:string };
type InternalDocument = { id:number; title:string; description:string; category:string; folder:string; visibility:string; requiresAcknowledgment:boolean; linkedTaskId:number|null; status:string; currentVersion:number; updatedAt:string };
type InternalDocumentVersion = { id:number; documentId:number; version:number; filename:string; contentType:string; sizeBytes:number; changeNote:string; uploadedBy:string; createdAt:string };
type DocumentAcknowledgment = { id:number; documentId:number; employeeId:number; version:number; acknowledgedAt:string };
type ProjectFile = { id:number; projectId:number; requestId:number|null; uploadedByEmail:string; uploadedByName:string; filename:string; contentType:string; sizeBytes:number; category:string; caption:string; visibleToClient:boolean; status:string; createdAt:string };
type BusinessSettings = {
  companyName:string; legalName:string; supportEmail:string; phone:string; website:string; address:string;
  timezone:string; currency:string; estimatePrefix:string; invoicePrefix:string; paymentTermsDays:number;
  defaultTaxRate:number; defaultDepositPercent:number; estimateExpirationDays:number; taskReminderDays:number;
  invoiceReminderDays:number; notifyNewLeads:boolean; notifyClientMessages:boolean; notifyOverdueInvoices:boolean;
  clientShowProgress:boolean; clientShowTasks:boolean; clientAllowUploads:boolean; clientAllowMessages:boolean;
  serviceCatalogJson:string; accentColor:string; updatedBy:string; updatedAt:string;
};
type ServiceCatalogItem = { id:string; name:string; priceCents:number; active:boolean };
type QuoteLineItem = { id:string; serviceId:string; description:string; quantity:number; rateCents:number };

const stages = [["new", "New"], ["contacted", "Contacted"], ["qualified", "Qualified"], ["proposal", "Proposal"], ["won", "Won"], ["lost", "Lost"]];
const menu = [
  ["dashboard", "▦", "Dashboard"], ["customers", "◎", "Customers"], ["projects", "◇", "Projects"],
  ["tasks", "✓", "Tasks"], ["employees", "♙", "Employees"], ["timecards", "◷", "Timecards"],
  ["documents", "▤", "Project files"], ["library", "▥", "Internal library"], ["calendar", "□", "Calendar"], ["billing", "$", "Quotes & invoices"],
  ["messages", "✉", "Messages"], ["reports", "▥", "Reports & analytics"], ["activity", "◉", "Activity log"], ["settings", "⚙", "Settings"],
];
const comingSoon = new Set<string>();
const roleMenu: Record<string, string[]> = {
  owner: menu.map(item => item[0]),
  admin: menu.map(item => item[0]),
  manager: ["dashboard", "customers", "projects", "tasks", "employees", "timecards", "documents", "library", "calendar", "billing", "messages", "reports"],
  sales: ["dashboard", "customers", "projects", "tasks", "documents", "library", "calendar", "billing", "messages", "reports"],
  support: ["dashboard", "customers", "projects", "tasks", "timecards", "documents", "library", "calendar", "messages"],
  employee: ["dashboard", "projects", "tasks", "timecards", "documents", "library", "calendar"],
};

export default function CrmDashboard({ displayName }: { displayName: string }) {
  const [pageOpenedAt] = useState(() => Date.now());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("dashboard");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeAccountMessage, setEmployeeAccountMessage] = useState("");
  const [clockEmployeeId, setClockEmployeeId] = useState<number | null>(null);
  const [timeMessage, setTimeMessage] = useState("");
  const [actor, setActor] = useState<Actor | null>(null);
  const [showClockPrompt, setShowClockPrompt] = useState(false);
  const [ptoRequests, setPtoRequests] = useState<PtoRequest[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [correctionEntry, setCorrectionEntry] = useState<TimeEntry | null>(null);
  const [billingDocuments, setBillingDocuments] = useState<BillingDocument[]>([]);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [previousView, setPreviousView] = useState("dashboard");
  const [documentToCancel, setDocumentToCancel] = useState<BillingDocument | null>(null);
  const [billingCategory, setBillingCategory] = useState<BillingCategory>("open");
  const [billingSort, setBillingSort] = useState<{ key: BillingSortKey; direction: "asc" | "desc" }>({ key: "issueDate", direction: "desc" });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [showLinkedDocuments, setShowLinkedDocuments] = useState(false);
  const [portalMessage, setPortalMessage] = useState("");
  const [projectMessages, setProjectMessages] = useState<ProjectMessage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");
  const [taskFilter, setTaskFilter] = useState("mine");
  const [internalDocuments, setInternalDocuments] = useState<InternalDocument[]>([]);
  const [internalVersions, setInternalVersions] = useState<InternalDocumentVersion[]>([]);
  const [documentAcknowledgments, setDocumentAcknowledgments] = useState<DocumentAcknowledgment[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFolder, setLibraryFolder] = useState("all");
  const [libraryStatus, setLibraryStatus] = useState("active");
  const [expandedInternalDocumentId, setExpandedInternalDocumentId] = useState<number | null>(null);
  const [showInternalUpload, setShowInternalUpload] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [showProjectUpload, setShowProjectUpload] = useState(false);
  const [projectFileMessage, setProjectFileMessage] = useState("");
  const [projectFileCustomer, setProjectFileCustomer] = useState("all");
  const [projectUploadCustomer, setProjectUploadCustomer] = useState("");
  const [projectFileSort, setProjectFileSort] = useState<"filename"|"customer"|"category"|"date"|"size">("date");
  const [projectFileDirection, setProjectFileDirection] = useState<"asc"|"desc">("desc");
  const [librarySort, setLibrarySort] = useState<"title"|"folder"|"access"|"version"|"updated">("updated");
  const [librarySortDirection, setLibrarySortDirection] = useState<"asc"|"desc">("desc");
  const [customerSort, setCustomerSort] = useState<"business"|"contact"|"status"|"created">("created");
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [notifications, setNotifications] = useState<HubNotification[]>([]);
  const [calendarMode, setCalendarMode] = useState<"month"|"agenda">("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [calendarType, setCalendarType] = useState("all");
  const [showEventForm, setShowEventForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportTab, setReportTab] = useState<"overview"|"sales"|"finance"|"projects"|"team"|"customers">("overview");
  const [reportRange, setReportRange] = useState("all");
  const [reportCustomer, setReportCustomer] = useState("all");
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsTab, setSettingsTab] = useState<"company"|"services"|"billing"|"notifications"|"portal"|"access">("company");
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [customerServiceId, setCustomerServiceId] = useState("");
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>([
    { id:"quote-line-1", serviceId:"", description:"", quantity:1, rateCents:0 },
  ]);
  const [testMode, setTestMode] = useState<TestMode | null>(null);
  const [testAccessMessage, setTestAccessMessage] = useState("");
  const [testRole, setTestRole] = useState("employee");
  const [testLeadId, setTestLeadId] = useState("");

  useEffect(() => { fetch("/api/leads").then(r => r.json()).then(data => {
    const params = new URLSearchParams(window.location.search);
    const linkedLeadId = Number(params.get("lead"));
    setLeads(data.leads || []);
    setSelectedId(linkedLeadId || data.leads?.[0]?.id || null);
    if (["customers", "projects", "billing"].includes(params.get("view") || "")) setView(params.get("view")!);
  }).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then(r => r.json()), fetch("/api/timecards").then(r => r.json()),
      fetch("/api/session").then(r => r.json()), fetch("/api/pto").then(r => r.json()),
      fetch("/api/schedules").then(r => r.json()),
      fetch("/api/billing").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/internal-documents").then(r => r.json()),
      fetch("/api/calendar").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([people, cards, session, pto, scheduleData, billing, projectData, library, calendarData, settingsData]) => {
      setEmployees(people.employees || []); setTimeEntries(cards.entries || []);
      setActor(session.actor || null); setClockEmployeeId(session.actor?.employeeId || null);
      setTestMode(session.testMode || null);
      setShowClockPrompt(Boolean(session.actor?.employeeId && !session.activeEntry));
      setPtoRequests(pto.requests || []); setSchedules(scheduleData.schedules || []);
      setBillingDocuments(billing.documents || []);
      setProjects(projectData.projects || []); setProjectTasks(projectData.tasks || []); setProjectTemplates(projectData.templates || []); setProjectFiles(projectData.files || []);
      setInternalDocuments(library.documents || []); setInternalVersions(library.versions || []); setDocumentAcknowledgments(library.acknowledgments || []);
      setCalendarItems(calendarData.timeline || []); setNotifications(calendarData.notifications || []);
      setSettings(settingsData.settings || null);
      try { setServiceCatalog(JSON.parse(settingsData.settings?.serviceCatalogJson || "[]")); } catch { setServiceCatalog([]); }
      if (["owner","admin"].includes(session.actor?.role)) fetch("/api/activity").then(r => r.json()).then(data => setActivity(data.activity || []));
    });
  }, []);
  useEffect(() => {
    if (!selectedId || view !== "messages") return;
    fetch(`/api/client-portal?leadId=${selectedId}`).then(r => r.json()).then(data => setProjectMessages(data.messages || []));
  }, [selectedId, view]);

  const selected = leads.find(lead => lead.id === selectedId) || null;
  const visible = useMemo(() => leads.filter(lead => {
    const open = !["won", "lost"].includes(lead.status);
    const matchesFilter = filter === "all" || (filter === "open" ? open : lead.status === filter);
    return matchesFilter && `${lead.name} ${lead.business} ${lead.email} ${lead.project}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a,b) => {
    if (customerSort === "contact") return a.name.localeCompare(b.name);
    if (customerSort === "status") return a.status.localeCompare(b.status);
    if (customerSort === "created") return b.createdAt.localeCompare(a.createdAt);
    return a.business.localeCompare(b.business);
  }), [leads, filter, query, customerSort]);
  const openLeads = leads.filter(l => !["won", "lost"].includes(l.status));
  const activeProjects = leads.filter(l => l.status === "won");
  const projectRecords = leads.filter(lead =>
    lead.status === "won" || billingDocuments.some(document => document.leadId === lead.id)
  );
  const openValue = openLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const followUps = openLeads.filter(l => l.nextFollowUp).length;
  const selectedEmployee = employees.find(employee => employee.id === selectedEmployeeId) || null;
  const activeEntry = timeEntries.find(entry => entry.employeeId === (actor?.employeeId || clockEmployeeId) && !entry.clockOut);
  const canManage = actor?.role === "owner" || actor?.role === "admin";
  const canManageProjects = ["owner", "admin", "sales", "support"].includes(actor?.role || "");
  const canManageLibrary = ["owner", "admin"].includes(actor?.role || "");
  const allowedMenuIds = roleMenu[actor?.role || ""] || ["dashboard"];
  const visibleMenu = menu.filter(([id]) => allowedMenuIds.includes(id));
  const unreadNotifications = notifications.filter(item => !item.read).length;
  const filteredCalendarItems = calendarItems.filter(item => calendarType === "all" || item.type === calendarType);
  const calendarMonthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
  const calendarGridStart = new Date(calendarMonthStart);
  calendarGridStart.setDate(1 - calendarMonthStart.getDay());
  const calendarDays = Array.from({length:42},(_,index) => {
    const day = new Date(calendarGridStart); day.setDate(calendarGridStart.getDate()+index); return day;
  });
  const libraryFolders = Array.from(new Set(internalDocuments.map(document => document.folder))).sort();
  const visibleInternalDocuments = internalDocuments.filter(document => {
    const matchesStatus = libraryStatus === "all" || document.status === libraryStatus;
    const matchesFolder = libraryFolder === "all" || document.folder === libraryFolder;
    const haystack = `${document.title} ${document.description} ${document.category} ${document.folder}`.toLowerCase();
    return matchesStatus && matchesFolder && haystack.includes(libraryQuery.toLowerCase());
  }).sort((a,b) => {
    const left = librarySort === "title" ? a.title : librarySort === "folder" ? a.folder : librarySort === "access" ? a.visibility : librarySort === "version" ? a.currentVersion : a.updatedAt;
    const right = librarySort === "title" ? b.title : librarySort === "folder" ? b.folder : librarySort === "access" ? b.visibility : librarySort === "version" ? b.currentVersion : b.updatedAt;
    const result = typeof left === "number" ? left - Number(right) : String(left).localeCompare(String(right), undefined, {numeric:true});
    return librarySortDirection === "asc" ? result : -result;
  });
  const selectedProject = projects.find(project => project.id === selectedProjectId)
    || projects.find(project => project.leadId === selectedId)
    || null;
  const selectedProjectLead = selectedProject ? leads.find(lead => lead.id === selectedProject.leadId) || null : null;
  const selectedProjectTasks = selectedProject ? projectTasks.filter(task => task.projectId === selectedProject.id) : [];
  const taskAssignee = (task: ProjectTask) => employees.find(employee => employee.id === task.assignedEmployeeId);
  const projectForLead = (leadId:number) => projects.find(project => project.leadId === leadId);

  useEffect(() => {
    if (actor && !allowedMenuIds.includes(view)) {
      const redirect = window.setTimeout(() => setView("dashboard"), 0);
      return () => window.clearTimeout(redirect);
    }
  }, [actor, view]);
  const billingCategoryFor = (doc: BillingDocument): BillingCategory => {
    if (doc.status === "void") return "canceled";
    if (["paid", "declined"].includes(doc.status)) return "closed";
    if (doc.kind === "estimate" && ["draft", "sent"].includes(doc.status)) return "estimates";
    return "open";
  };
  const billingCategoryCounts = billingDocuments.reduce<Record<BillingCategory, number>>((counts, doc) => {
    counts[billingCategoryFor(doc)] += 1;
    return counts;
  }, { open: 0, estimates: 0, closed: 0, canceled: 0 });
  const visibleBillingDocuments = useMemo(() => {
    const valueFor = (doc: BillingDocument, key: BillingSortKey): string | number => {
      if (key === "customer") return (doc.customerBusiness || doc.customerName).toLowerCase();
      if (key === "total") return doc.totalCents;
      if (key === "dueDate") return doc.dueDate || "";
      return doc[key].toLowerCase();
    };
    return billingDocuments
      .filter(doc => billingCategoryFor(doc) === billingCategory)
      .sort((a, b) => {
        const left = valueFor(a, billingSort.key);
        const right = valueFor(b, billingSort.key);
        const comparison = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
        return billingSort.direction === "asc" ? comparison : -comparison;
      });
  }, [billingDocuments, billingCategory, billingSort]);
  const reportCutoff = useMemo(() => {
    if (reportRange === "all") return null;
    const date = new Date();
    date.setDate(date.getDate() - Number(reportRange));
    return date.toISOString().slice(0,10);
  }, [reportRange]);
  const reportLeads = leads.filter(lead =>
    (!reportCutoff || lead.createdAt.slice(0,10) >= reportCutoff) &&
    (reportCustomer === "all" || lead.id === Number(reportCustomer))
  );
  const reportBilling = billingDocuments.filter(document =>
    (!reportCutoff || document.issueDate >= reportCutoff) &&
    (reportCustomer === "all" || document.leadId === Number(reportCustomer))
  );
  const reportProjects = projects.filter(project =>
    reportCustomer === "all" || project.leadId === Number(reportCustomer)
  );
  const reportTasks = projectTasks.filter(task => reportProjects.some(project => project.id === task.projectId));
  const reportTime = timeEntries.filter(entry => !reportCutoff || entry.clockIn.slice(0,10) >= reportCutoff);
  const totalInvoiced = reportBilling.filter(document => document.kind === "invoice" && document.status !== "void").reduce((sum, document) => sum + document.totalCents, 0);
  const totalCollected = reportBilling.reduce((sum, document) => sum + document.paidCents, 0);
  const totalOutstanding = reportBilling.filter(document => document.kind === "invoice" && document.status !== "void").reduce((sum, document) => sum + Math.max(0, document.totalCents - document.paidCents), 0);
  const wonLeads = reportLeads.filter(lead => lead.status === "won").length;
  const closedLeads = reportLeads.filter(lead => ["won","lost"].includes(lead.status)).length;
  const conversionRate = closedLeads ? Math.round(wonLeads / closedLeads * 100) : 0;
  const completedTasks = reportTasks.filter(task => task.status === "done").length;
  const taskCompletion = reportTasks.length ? Math.round(completedTasks / reportTasks.length * 100) : 0;
  const trackedHours = reportTime.reduce((sum, entry) => entry.clockOut ? sum + Math.max(0,(new Date(entry.clockOut).getTime()-new Date(entry.clockIn).getTime())/3600000-entry.breakMinutes/60) : sum,0);
  const stageBreakdown = stages.map(([value,label]) => ({ label, value: reportLeads.filter(lead => lead.status === value).length }));
  const projectBreakdown = [["planning","Planning"],["in_progress","In progress"],["client_review","Client review"],["complete","Complete"],["on_hold","On hold"]].map(([value,label]) => ({ label, value: reportProjects.filter(project => project.status === value).length }));
  const reportMax = Math.max(1,...stageBreakdown.map(item => item.value),...projectBreakdown.map(item => item.value));
  const collectionRate = totalInvoiced ? Math.min(100,Math.round(totalCollected/totalInvoiced*100)) : 0;
  const openTaskCount = reportTasks.filter(task=>task.status!=="done").length;
  const blockedTaskCount = reportTasks.filter(task=>task.status==="blocked").length;
  const overdueTaskCount = reportTasks.filter(task=>task.status!=="done" && task.dueDate && task.dueDate < new Date().toISOString().slice(0,10)).length;
  const reportRangeLabel = reportRange === "all" ? "All time" : reportRange === "365" ? "Last 12 months" : `Last ${reportRange} days`;
  const reportCustomerLabel = reportCustomer === "all" ? "All customers" : (leads.find(lead=>lead.id===Number(reportCustomer))?.business || leads.find(lead=>lead.id===Number(reportCustomer))?.name || "Selected customer");

  function sortBilling(key: BillingSortKey) {
    setBillingSort(current => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "issueDate" || key === "dueDate" || key === "total" ? "desc" : "asc" });
  }
  function sortIndicator(key: BillingSortKey) {
    return billingSort.key === key ? (billingSort.direction === "asc" ? " ↑" : " ↓") : "";
  }
  function exportReport() {
    const rows = [
      ["Metric","Value"],
      ["Leads",String(reportLeads.length)],["Won customers",String(wonLeads)],["Conversion rate",`${conversionRate}%`],
      ["Invoiced",(totalInvoiced/100).toFixed(2)],["Collected",(totalCollected/100).toFixed(2)],["Outstanding",(totalOutstanding/100).toFixed(2)],
      ["Projects",String(reportProjects.length)],["Task completion",`${taskCompletion}%`],["Tracked hours",trackedHours.toFixed(2)],
    ];
    const blob = new Blob([rows.map(row => row.map(value => `"${value.replaceAll('"','""')}"`).join(",")).join("\n")],{type:"text/csv"});
    const link = document.createElement("a"); link.href=URL.createObjectURL(blob); link.download=`pixel-hutch-report-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  function updateSelected(patch: Partial<Lead>) { setLeads(current => current.map(lead => lead.id === selectedId ? { ...lead, ...patch } : lead)); }
  async function saveLead() {
    if (!selected) return; setSaving(true);
    try { await fetch("/api/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) }); }
    finally { setSaving(false); }
  }
  async function addCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomerMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await response.json();
    if (!response.ok) {
      setCustomerMessage(data.error || "Unable to add this customer.");
      return;
    }
    setLeads(current => [data.lead, ...current]);
    setSelectedId(data.lead.id);
    setFilter("all");
    setShowCustomerForm(false);
    setCustomerMessage(`${data.lead.business} was added.`);
    setCustomerServiceId("");
    formElement.reset();
  }

  function openView(next: string) {
    if (next !== view) setPreviousView(view);
    setView(next);
    if (next === "customers" && !selectedId && leads[0]) setSelectedId(leads[0].id);
  }
  function openCustomer(leadId: number) {
    setSelectedId(leadId);
    setShowLinkedDocuments(false);
    openView("customers");
  }
  function openProject(leadId: number) {
    setSelectedId(leadId);
    setSelectedProjectId(projectForLead(leadId)?.id || null);
    openView("projects");
  }
  function openDocuments(_leadId?: number) {
    setProjectFileCustomer("all");
    openView("documents");
  }
  const sortedProjectFiles = projectFiles
    .filter(file => {
      if (projectFileCustomer === "all") return true;
      const project = projects.find(item => item.id === file.projectId);
      return project?.leadId === Number(projectFileCustomer);
    })
    .sort((a,b) => {
      const leadFor = (file:ProjectFile) => {
        const project = projects.find(item => item.id === file.projectId);
        return leads.find(lead => lead.id === project?.leadId)?.business || "";
      };
      const left = projectFileSort === "filename" ? a.filename : projectFileSort === "customer" ? leadFor(a) : projectFileSort === "category" ? a.category : projectFileSort === "size" ? a.sizeBytes : a.createdAt;
      const right = projectFileSort === "filename" ? b.filename : projectFileSort === "customer" ? leadFor(b) : projectFileSort === "category" ? b.category : projectFileSort === "size" ? b.sizeBytes : b.createdAt;
      const result = typeof left === "number" ? left - Number(right) : String(left).localeCompare(String(right), undefined, {numeric:true});
      return projectFileDirection === "asc" ? result : -result;
    });
  async function uploadProjectFile(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const leadId = Number(form.get("leadId"));
    if (!leadId) return setProjectFileMessage("Choose a customer before uploading a file.");
    setProjectFileMessage("Uploading…");
    const response = await fetch("/api/client-portal", { method:"POST", body:form });
    const data = await response.json();
    if (!response.ok) return setProjectFileMessage(data.error || "Unable to upload this file.");
    const projectData = await fetch("/api/projects").then(item => item.json());
    setProjects(projectData.projects || []); setProjectFiles(projectData.files || []);
    setProjectUploadCustomer(""); setShowProjectUpload(false); setProjectFileMessage("Project file uploaded.");
    formElement.reset();
  }
  function goBack() {
    const destination = previousView === view ? "dashboard" : previousView;
    setPreviousView("dashboard");
    setView(destination);
  }
  async function refreshInternalLibrary() {
    const data = await fetch("/api/internal-documents").then(response => response.json());
    setInternalDocuments(data.documents || []); setInternalVersions(data.versions || []); setDocumentAcknowledgments(data.acknowledgments || []);
  }
  async function uploadInternalDocument(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLibraryMessage("Uploading…");
    const response = await fetch("/api/internal-documents", { method:"POST", body:new FormData(event.currentTarget) });
    const data = await response.json();
    if (!response.ok) return setLibraryMessage(data.error || "Unable to upload this document.");
    setInternalDocuments(data.documents || []); setInternalVersions(data.versions || []); setDocumentAcknowledgments(data.acknowledgments || []);
    setShowInternalUpload(false); setLibraryMessage("Document added to the Internal Library."); event.currentTarget.reset();
  }
  async function acknowledgeInternalDocument(document:InternalDocument) {
    const response = await fetch("/api/internal-documents", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"acknowledge",documentId:document.id}) });
    const data = await response.json();
    if (response.ok) { setDocumentAcknowledgments(data.acknowledgments || []); setLibraryMessage(`${document.title} acknowledged.`); }
  }
  async function setInternalDocumentArchive(document:InternalDocument) {
    const action = document.status === "archived" ? "restore" : "archive";
    const response = await fetch("/api/internal-documents", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:document.id,action}) });
    const data = await response.json();
    if (response.ok) { setInternalDocuments(data.documents || []); setLibraryMessage(action === "archive" ? "Document archived." : "Document restored."); }
  }
  async function addEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/employees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, payRateCents: Math.round(Number(payload.payRate || 0) * 100) }),
    });
    const data = await response.json();
    if (response.ok) {
      setEmployees(current => [...current, data.employee]);
      setShowEmployeeForm(false);
      event.currentTarget.reset();
    }
  }

  async function updateEmployee(patch: Partial<Employee>) {
    if (!selectedEmployee) return;
    const response = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedEmployee.id, ...patch }) });
    const data = await response.json();
    if (response.ok) setEmployees(current => current.map(employee => employee.id === data.employee.id ? data.employee : employee));
  }

  async function employeeAccountAction(action: "send" | "remove") {
    if (!selectedEmployee) return;
    setEmployeeAccountMessage("");
    const response = await fetch(`/api/employees/account${action === "remove" ? `?employeeId=${selectedEmployee.id}` : ""}`, {
      method: action === "remove" ? "DELETE" : "POST",
      headers: action === "send" ? { "Content-Type": "application/json" } : undefined,
      body: action === "send" ? JSON.stringify({ employeeId: selectedEmployee.id }) : undefined,
    });
    const data = await response.json();
    setEmployeeAccountMessage(data.message || data.error || "Account updated.");
  }

  async function refreshTimecards() {
    const data = await fetch("/api/timecards").then(response => response.json());
    setTimeEntries(data.entries || []);
  }

  async function timeAction(action: "clockIn" | "clockOut" | "startBreak" | "endBreak" | "approve" | "reopen" | "applyCorrection" | "denyCorrection", entry?: TimeEntry) {
    setTimeMessage("");
    const response = action === "clockIn"
      ? await fetch("/api/timecards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: clockEmployeeId }) })
      : await fetch("/api/timecards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: entry?.id || activeEntry?.id, action }) });
    const data = await response.json();
    setTimeMessage(response.ok ? (action === "clockIn" ? "Clocked in successfully." : action === "clockOut" ? "Shift completed." : action === "approve" ? "Time entry approved." : "Time entry reopened.") : (data.error || "Unable to update time."));
    if (response.ok) await refreshTimecards();
    if (response.ok && action === "clockIn") setShowClockPrompt(false);
  }

  async function submitPto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/pto", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(form.entries())) });
    if (response.ok) { const data = await fetch("/api/pto").then(r => r.json()); setPtoRequests(data.requests || []); event.currentTarget.reset(); }
  }
  async function reviewPto(id:number, action:"approve"|"deny") {
    await fetch("/api/pto", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,action}) });
    const data = await fetch("/api/pto").then(r => r.json()); setPtoRequests(data.requests || []);
  }
  async function addSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/schedules", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(form.entries())) });
    if (response.ok) { const data = await fetch("/api/schedules").then(r => r.json()); setSchedules(data.schedules || []); event.currentTarget.reset(); }
  }
  async function refreshCalendar() {
    const data = await fetch("/api/calendar").then(r => r.json());
    setCalendarItems(data.timeline || []); setNotifications(data.notifications || []);
  }
  async function addCalendarEvent(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/calendar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,allDay:payload.allDay === "on"})});
    if(response.ok){setShowEventForm(false);event.currentTarget.reset();await refreshCalendar();}
  }
  async function notificationAction(key:string,action:"read"|"dismiss") {
    const response = await fetch("/api/calendar",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,action})});
    if(response.ok) await refreshCalendar();
  }
  async function saveSettings(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSettingsMessage("Saving…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        ...Object.fromEntries(form.entries()),
        notifyNewLeads:form.has("notifyNewLeads"),
        notifyClientMessages:form.has("notifyClientMessages"),
        notifyOverdueInvoices:form.has("notifyOverdueInvoices"),
        clientShowProgress:form.has("clientShowProgress"),
        clientShowTasks:form.has("clientShowTasks"),
        clientAllowUploads:form.has("clientAllowUploads"),
        clientAllowMessages:form.has("clientAllowMessages"),
        serviceCatalogJson:JSON.stringify(serviceCatalog),
      }),
    });
    const data = await response.json();
    if (response.ok) { setSettings(data.settings); setSettingsMessage("Settings saved and applied."); }
    else setSettingsMessage(data.error || "Unable to save settings.");
  }
  async function requestCorrection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!correctionEntry) return; const form = new FormData(event.currentTarget);
    const response = await fetch("/api/timecards", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:correctionEntry.id, action:"requestCorrection", ...Object.fromEntries(form.entries())}) });
    if (response.ok) { setCorrectionEntry(null); await refreshTimecards(); }
  }
  async function refreshBilling() {
    const data = await fetch("/api/billing", { cache:"no-store" }).then(r => r.json());
    setBillingDocuments(data.documents || []);
    return data.documents || [];
  }
  async function createBillingDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBillingMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const lineItems = quoteLineItems
      .filter(item => item.serviceId && item.description.trim())
      .map(item => ({
        serviceId:item.serviceId,
        description:item.description.trim(),
        quantity:Math.max(1, Number(item.quantity || 1)),
        rateCents:Math.max(0, Math.round(Number(item.rateCents || 0))),
      }));
    if (!lineItems.length) {
      setBillingMessage("Add at least one service line.");
      return;
    }
    const response = await fetch("/api/billing", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
      ...payload, recurring: payload.recurrence !== "one_time",
      lineItems,
    }) });
    const data = await response.json();
    if (response.ok) {
      setBillingDocuments(data.documents || []);
      setShowBillingForm(false);
      setQuoteLineItems([{ id:`quote-line-${Date.now()}`, serviceId:"", description:"", quantity:1, rateCents:0 }]);
      setBillingMessage("Draft created.");
      event.currentTarget.reset();
    }
    else setBillingMessage(data.error || "Unable to create draft.");
  }

  function updateQuoteLine(id:string, patch:Partial<QuoteLineItem>) {
    setQuoteLineItems(current => current.map(line => line.id === id ? { ...line, ...patch } : line));
  }

  function chooseQuoteService(id:string, serviceId:string) {
    if (serviceId === "custom") {
      updateQuoteLine(id, { serviceId, description:"", rateCents:0 });
      return;
    }
    const service = serviceCatalog.find(item => item.id === serviceId && item.active);
    updateQuoteLine(id, {
      serviceId,
      description:service?.name || "",
      rateCents:service?.priceCents || 0,
    });
  }

  function addQuoteLine() {
    setQuoteLineItems(current => [...current, {
      id:`quote-line-${Date.now()}-${current.length}`,
      serviceId:"",
      description:"",
      quantity:1,
      rateCents:0,
    }]);
  }

  function removeQuoteLine(id:string) {
    setQuoteLineItems(current => current.length > 1 ? current.filter(line => line.id !== id) : current);
  }
  async function updateBillingStatus(id:number, status:string) {
    setBillingMessage(status === "accepted" ? "Converting estimate to invoice…" : "Updating document…");
    try {
      const response = await fetch("/api/billing", {
        method:"PATCH",
        cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id,status}),
      });
      const data = await response.json();
      if (!response.ok) {
        setBillingMessage(data.error || "Unable to update this document.");
        return;
      }
      if (status === "accepted") {
        const invoice = data.invoice as BillingDocument | undefined;
        if (!data.converted || !invoice || invoice.id !== id || invoice.kind !== "invoice") {
          setBillingMessage("The estimate was not converted. Please try again.");
          await refreshBilling();
          return;
        }
        setBillingDocuments((data.documents || []).map((document:BillingDocument) =>
          document.id === id ? invoice : document
        ));
        setBillingCategory("open");
        const refreshed = await refreshBilling();
        const savedInvoice = refreshed.find((document:BillingDocument) => document.id === id);
        if (!savedInvoice || savedInvoice.kind !== "invoice") {
          setBillingCategory("estimates");
          setBillingMessage("The invoice did not save correctly. Please try again.");
          return;
        }
        setBillingMessage(`${savedInvoice.number} was created and moved to Open invoices.`);
      } else {
        setBillingDocuments(data.documents || []);
        setBillingMessage("Document status updated.");
      }
    } catch {
      setBillingMessage("The billing update could not be completed. Please try again.");
    }
  }
  async function cancelBillingDocument() {
    if (!documentToCancel || !canManage) return;
    const response = await fetch("/api/billing", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id:documentToCancel.id,status:"void"}),
    });
    const data = await response.json();
    setBillingMessage(response.ok ? `${documentToCancel.number} was canceled.` : (data.error || "Unable to cancel this document."));
    if (response.ok) await refreshBilling();
    setDocumentToCancel(null);
  }
  async function recordPayment(event:React.FormEvent<HTMLFormElement>, documentId:number) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/billing", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"payment",billingDocumentId:documentId,...Object.fromEntries(form.entries())}) });
    if (response.ok) { await refreshBilling(); event.currentTarget.reset(); }
  }
  async function portalAction(event:React.FormEvent<HTMLFormElement>, action:"updateProject"|"addUpdate"|"requestFile") {
    event.preventDefault();
    if (!selectedId) return;
    setPortalMessage("Saving…");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const response = await fetch("/api/client-portal", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        leadId:selectedId, action, ...values,
        progress:Number(form.get("progress") || 0),
        visibleToClient:form.has("visibleToClient"),
        required:form.has("required"),
      }),
    });
    const data = await response.json();
    setPortalMessage(response.ok ? (action === "addUpdate" ? "Client update posted." : action === "requestFile" ? "File request added." : "Client-facing project status saved.") : (data.error || "Unable to update the client portal."));
    if (response.ok && action !== "updateProject") event.currentTarget.reset();
  }
  async function sendStaffMessage(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setPortalMessage("Sending…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/client-portal", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ leadId:selectedId, action:"sendMessage", message:form.get("message") }),
    });
    const data = await response.json();
    setPortalMessage(response.ok ? "Message sent to the client." : (data.error || "Unable to send message."));
    if (response.ok) {
      event.currentTarget.reset();
      if (data.message) {
        setProjectMessages(current => [...current, data.message]);
      } else {
        const refreshed = await fetch(`/api/client-portal?leadId=${selectedId}`).then(r => r.json());
        setProjectMessages(refreshed.messages || []);
      }
    }
  }
  async function createProject(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setProjectMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"createProject", ...Object.fromEntries(form.entries()) }) });
    const data = await response.json();
    if (!response.ok) return setProjectMessage(data.error || "Unable to create project.");
    setProjects(data.projects || []); setProjectTasks(data.tasks || []); setProjectTemplates(data.templates || []);
    const leadId = Number(form.get("leadId")); const project = (data.projects || []).find((item:Project) => item.leadId === leadId);
    setSelectedId(leadId); setSelectedProjectId(project?.id || null); setShowProjectForm(false); setProjectMessage("Project created.");
    event.currentTarget.reset();
  }
  async function createTask(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedProject) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"createTask", projectId:selectedProject.id, ...Object.fromEntries(form.entries()), visibleToClient:form.has("visibleToClient"), clientApprovalRequired:form.has("clientApprovalRequired") }) });
    const data = await response.json();
    if (!response.ok) return setProjectMessage(data.error || "Unable to add task.");
    setProjects(data.projects || []); setProjectTasks(data.tasks || []); setProjectTemplates(data.templates || []); setShowTaskForm(false); setProjectMessage("Task added."); event.currentTarget.reset();
  }
  async function updateTask(task:ProjectTask, patch:Partial<ProjectTask>) {
    const response = await fetch("/api/projects", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"updateTask", id:task.id, ...patch }) });
    const data = await response.json();
    if (response.ok) { setProjects(data.projects || []); setProjectTasks(data.tasks || []); }
  }
  async function updateProject(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedProject) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"updateProject", id:selectedProject.id, ...Object.fromEntries(form.entries()) }) });
    const data = await response.json();
    if (response.ok) { setProjects(data.projects || []); setProjectTasks(data.tasks || []); setProjectMessage("Project details saved."); }
  }
  async function applyTemplate(templateId:number) {
    if (!selectedProject) return;
    const response = await fetch("/api/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"applyTemplate", projectId:selectedProject.id, templateId }) });
    const data = await response.json();
    if (response.ok) { setProjects(data.projects || []); setProjectTasks(data.tasks || []); setProjectTemplates(data.templates || []); setProjectMessage("Template tasks added."); }
  }

  async function startRoleTest() {
    setTestAccessMessage("Starting Test Mode…");
    const response = await fetch("/api/test-access", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({mode:"role",role:testRole}),
    });
    const data = await response.json();
    if (!response.ok) return setTestAccessMessage(data.error || "Unable to start Test Mode.");
    window.location.href = "/crm";
  }

  async function startClientTest() {
    const leadId = Number(testLeadId);
    if (!leadId) return setTestAccessMessage("Choose a test customer first.");
    setTestAccessMessage("Opening the test client account…");
    const response = await fetch("/api/test-access", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({mode:"client",leadId}),
    });
    const data = await response.json();
    if (!response.ok) return setTestAccessMessage(data.error || "Unable to start the test client.");
    window.location.href = `/portal?project=${leadId}`;
  }

  async function exitTestMode() {
    await fetch("/api/test-access", {method:"DELETE"});
    window.location.href = "/crm?view=settings";
  }

  return <main className="portal-shell">
    <aside className="portal-sidebar">
      <div className="portal-brand" aria-label="Pixel Hutch Business Hutch"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><span>BUSINESS HUTCH</span></div>
      <nav className="portal-menu" aria-label="Employee workspace">
        {visibleMenu.map(([id, icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => openView(id)}><i>{icon}</i><span>{label}</span>{comingSoon.has(id) && <small>SOON</small>}</button>)}
      </nav>
      <Link className="portal-exit-link" href="/">Exit to public website ↗</Link>
      <div className="portal-user"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>{actor?.role || "Owner"}</small></div><a aria-label="Sign out" href="/api/auth/logout?returnTo=/login">↗</a></div>
    </aside>

    <section className="portal-main">
      {testMode?.mode === "role" && <div className="test-mode-banner" role="status"><div><b>TEST MODE</b><span>You are viewing the Business Hutch as <strong>{testMode.role}</strong>. Your Owner permissions are temporarily hidden.</span></div><button onClick={exitTestMode}>Return to Owner</button></div>}
      <header className="portal-topbar"><div><button className="mobile-menu" aria-label="Open navigation">☰</button><span>Pixel Hutch internal workspace</span></div><div className="notification-anchor"><button className="notification-button" aria-label={`${unreadNotifications} unread notifications`} onClick={() => setShowNotifications(current => !current)}>●{unreadNotifications > 0 && <b>{unreadNotifications}</b>}</button><span>{actor ? `${actor.role} access` : "Secure employee access"}</span>{showNotifications && <section className="notification-panel"><header><div><p className="crm-eyebrow">NOTIFICATIONS</p><h3>What needs attention</h3></div><button onClick={() => {setShowNotifications(false);openView("calendar");}}>Open calendar →</button></header>{notifications.length ? notifications.slice(0,8).map(item => <article key={item.key} className={`${item.read ? "is-read" : ""} ${item.urgency}`}><button onClick={() => notificationAction(item.key,"read")}><i>{item.type === "billing" ? "$" : item.type === "task" ? "✓" : item.type === "shift" ? "◷" : "□"}</i><span><b>{item.title}</b><small>{item.start.slice(0,10)} · {item.detail}</small></span><em>{item.urgency}</em></button><button aria-label={`Dismiss ${item.title}`} onClick={() => notificationAction(item.key,"dismiss")}>×</button></article>) : <div className="friendly-empty small"><span>✓</span><h3>You&apos;re caught up.</h3><p>No deadlines or events need attention.</p></div>}</section>}</div></header>
      {view !== "dashboard" && <div className="portal-backbar"><button onClick={goBack} aria-label={`Go back from ${menu.find(item => item[0] === view)?.[2] || "this page"}`}>← Back</button><span>Dashboard / {menu.find(item => item[0] === view)?.[2] || view}</span></div>}

      {showClockPrompt && <div className="clock-prompt-backdrop"><section className="clock-prompt" role="dialog" aria-modal="true" aria-labelledby="clock-prompt-title"><span>◷</span><p className="crm-eyebrow">WELCOME BACK</p><h2 id="clock-prompt-title">Are you starting work?</h2><p>You are not currently clocked in. Start your shift now, or continue without clocking in.</p><div><button className="crm-primary-button" onClick={() => timeAction("clockIn")}>Clock in now</button><button onClick={() => setShowClockPrompt(false)}>Not right now</button></div></section></div>}

      {view === "dashboard" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">BUSINESS OVERVIEW</p><h1>Good morning, {displayName.split(" ")[0]}.</h1><p>Here&apos;s what needs your attention across Pixel Hutch today.</p></div><button className="crm-primary-button" onClick={() => openView("customers")}>View customers</button></div>
        <div className="hub-stats"><article><span>OPEN LEADS</span><strong>{openLeads.length}</strong><small>in the sales pipeline</small></article><article><span>PIPELINE VALUE</span><strong>${openValue.toLocaleString()}</strong><small>estimated opportunity</small></article><article><span>ACTIVE PROJECTS</span><strong>{activeProjects.length}</strong><small>won customer jobs</small></article><article><span>FOLLOW-UPS</span><strong>{followUps}</strong><small>currently scheduled</small></article></div>
        <div className="dashboard-grid">
          <section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">CUSTOMERS</p><h2>Lead pipeline</h2></div><button onClick={() => openView("customers")}>See all →</button></div>{loading ? <p className="empty-leads">Loading leads…</p> : openLeads.length ? <div className="dashboard-leads">{openLeads.slice(0, 4).map(lead => <button key={lead.id} onClick={() => { setSelectedId(lead.id); openView("customers"); }}><i className={`status-dot ${lead.status}`} /><span><b>{lead.business}</b><small>{lead.name} · {lead.project}</small></span><em>{lead.status}</em></button>)}</div> : <div className="friendly-empty"><span>+</span><h3>Your next customer starts here.</h3><p>Website inquiries will appear automatically. You can also add leads manually in the Customers area.</p></div>}</section>
          <section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">QUICK ACCESS</p><h2>Run the business</h2></div></div><div className="quick-grid">{[["projects","◇","Projects","Track builds and milestones"],["tasks","✓","Tasks","See assigned work"],["library","▥","Internal library","SOPs, policies and templates"],["timecards","◷","Timecards","Hours and approvals"]].filter(([id]) => allowedMenuIds.includes(id)).map(([id,icon,title,copy]) => <button key={id} onClick={() => openView(id)}><i>{icon}</i><span><b>{title}</b><small>{copy}</small></span><em>→</em></button>)}</div></section>
        </div>
      </div>}

      {view === "customers" && <div className="portal-page customers-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">CUSTOMERS & SALES</p><h1>Customers</h1><p>Manage every inquiry, conversation, and opportunity in one place.</p></div><button className={showCustomerForm ? "crm-secondary-button" : "crm-primary-button"} onClick={() => { setShowCustomerForm(current => !current); setCustomerMessage(""); }}>{showCustomerForm ? "Cancel" : "+ Add customer"}</button></div>
        {showCustomerForm && <form className="customer-create" onSubmit={addCustomer}>
          <div className="customer-create-head"><div><p className="crm-eyebrow">NEW CUSTOMER</p><h2>Add a customer or lead</h2><p>Create the main record now. Estimates, invoices, and projects can all link to it afterward.</p></div><span>Required fields are marked *</span></div>
          <div className="customer-form-grid">
            <label>Contact name *<input name="name" required autoFocus placeholder="Jane Smith" /></label>
            <label>Business name<input name="business" placeholder="Smith & Co. (optional)" /></label>
            <label>Email *<input name="email" type="email" required placeholder="jane@example.com" /></label>
            <label>Phone<input name="phone" type="tel" placeholder="(555) 555-5555" /></label>
            <label>Project or service *<select name="serviceId" required value={customerServiceId} onChange={event => setCustomerServiceId(event.target.value)}><option value="">Choose a service…</option>{serviceCatalog.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name} — ${(item.priceCents/100).toLocaleString(undefined,{minimumFractionDigits:2})}</option>)}<option value="custom">Custom project</option></select></label>
            <label>Stage<select name="status" defaultValue="new">{stages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {customerServiceId === "custom" && <label>Custom service name *<input name="customServiceName" required placeholder="Describe the custom work" disabled={!canManage} /></label>}
            <label>Estimated value{customerServiceId === "custom" ? <input name="estimatedValue" type="number" min="0" step=".01" defaultValue="" disabled={!canManage} placeholder={canManage ? "Enter approved price" : "Approval required"} /> : <input name="estimatedValue" type="number" value={customerServiceId ? ((serviceCatalog.find(item => item.id === customerServiceId)?.priceCents || 0)/100) : ""} readOnly placeholder="Choose a service" />}{customerServiceId === "custom" && !canManage && <small>Owner or Admin approval is required for custom pricing.</small>}</label>
            <label>Next follow-up<input name="nextFollowUp" type="date" /></label>
            <label>Budget<input name="budget" placeholder="$2,500–$5,000" /></label>
            <label>Timeline<input name="timeline" placeholder="Within 30 days" /></label>
            <label>Source<input name="referral" placeholder="Referral, website, phone…" /></label>
          </div>
          <label className="customer-wide-field">Initial details<textarea name="message" rows={3} placeholder="What does the customer need?" /></label>
          <label className="customer-wide-field">Internal notes<textarea name="notes" rows={3} placeholder="Private notes, next steps, or context…" /></label>
          <div className="customer-form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowCustomerForm(false)}>Cancel</button><button className="crm-primary-button">Add customer</button></div>
        </form>}
        {customerMessage && <p className="customer-message" role="status">{customerMessage}</p>}
        <section className="crm-workspace">
          <aside className="lead-list-panel"><div className="lead-tools"><input aria-label="Search customers" placeholder="Search customers…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter customers" value={filter} onChange={e => setFilter(e.target.value)}><option value="open">Open leads</option><option value="all">All customers</option>{stages.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><select aria-label="Sort customers" value={customerSort} onChange={e => setCustomerSort(e.target.value as typeof customerSort)}><option value="created">Newest first</option><option value="business">Business A–Z</option><option value="contact">Contact A–Z</option><option value="status">Stage</option></select></div><div className="lead-list">{loading ? <p className="empty-leads">Loading customers…</p> : visible.length === 0 ? <div className="friendly-empty small"><span>+</span><h3>No customers here yet.</h3><p>New inquiries will appear automatically.</p></div> : visible.map(lead => <button key={lead.id} className={selectedId === lead.id ? "lead-row active" : "lead-row"} onClick={() => setSelectedId(lead.id)}><i className={`status-dot ${lead.status}`} /><span><b>{lead.business}</b><small>{lead.name} · {lead.project}</small></span><time>{new Date(lead.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</time></button>)}</div></aside>
          <section className="lead-detail">{selected ? <><div className="lead-detail-head"><div><p className="crm-eyebrow">CUSTOMER #{selected.id}</p><h2>{selected.business}</h2><p>{selected.name} · <a href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone && <> · <a href={`tel:${selected.phone}`}>{selected.phone}</a></>}</p></div><button className="crm-primary-button" onClick={saveLead} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div><section className="customer-record-shortcuts" aria-label="Related customer records"><header><span>CONNECTED WORK</span><p>Jump to this customer&apos;s project or billing history.</p></header><div><button onClick={() => openProject(selected.id)}><i>◇</i><span><small>PROJECT</small><b>{selected.project || "Customer project"}</b><em>{selectedProject ? `${selectedProject.status.replaceAll("_"," ")} · ${selectedProject.progress}% complete` : "Not started yet"}</em></span><strong>View project <b>→</b></strong></button><button aria-expanded={showLinkedDocuments} onClick={() => setShowLinkedDocuments(current => !current)}><i>$</i><span><small>BILLING</small><b>{billingDocuments.filter(document => document.leadId === selected.id).length} {billingDocuments.filter(document => document.leadId === selected.id).length === 1 ? "document" : "documents"}</b><em>${(billingDocuments.filter(document => document.leadId === selected.id && document.kind === "invoice").reduce((sum,document)=>sum+Math.max(0,document.totalCents-document.paidCents),0)/100).toLocaleString(undefined,{minimumFractionDigits:2})} outstanding</em></span><strong>{showLinkedDocuments ? "Hide documents" : "View documents"} <b>{showLinkedDocuments ? "↑" : "↓"}</b></strong></button></div></section>
          {showLinkedDocuments && <section className="customer-linked-documents"><header><div><p className="crm-eyebrow">LINKED DOCUMENTS</p><h3>Estimates & invoices</h3></div><button onClick={() => openDocuments(selected.id)}>View all documents →</button></header>{billingDocuments.filter(document => document.leadId === selected.id).length ? <div>{billingDocuments.filter(document => document.leadId === selected.id).map(document => <article key={document.id}><a href={`/crm/billing/${document.id}`} target="_blank" rel="noreferrer"><span><b>{document.number}</b><small>{document.kind} · {document.status}</small></span><strong>${(document.totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><em>Open ↗</em></a></article>)}</div> : <p>No estimates or invoices are linked to this customer yet.</p>}</section>}
          <div className="lead-fields"><label>Stage<select value={selected.status} onChange={e => updateSelected({ status: e.target.value })}>{stages.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Estimated value<input type="number" min="0" value={selected.estimatedValue} onChange={e => updateSelected({ estimatedValue: Number(e.target.value) })} /></label><label>Next follow-up<input type="date" value={selected.nextFollowUp || ""} onChange={e => updateSelected({ nextFollowUp: e.target.value || null })} /></label></div><div className="lead-brief"><article><span>PROJECT</span><b>{selected.project}</b></article><article><span>BUDGET</span><b>{selected.budget}</b></article><article><span>TIMELINE</span><b>{selected.timeline}</b></article><article><span>SOURCE</span><b>{selected.referral || "Not provided"}</b></article></div><div className="lead-message"><span>ORIGINAL INQUIRY</span><p>{selected.message}</p></div><label className="lead-notes">Working notes<textarea rows={7} placeholder="Conversation notes, next steps, quote details…" value={selected.notes} onChange={e => updateSelected({ notes: e.target.value })} /></label></> : <div className="no-selection"><span>PH</span><h2>Select a customer</h2><p>Choose a record to see contact details, project needs, and notes.</p></div>}</section>
        </section>
      </div>}

      {view === "projects" && <div className="portal-page projects-workspace"><div className="portal-page-head"><div><p className="crm-eyebrow">DELIVERY WORKSPACE</p><h1>Projects</h1><p>Turn accepted work into organized milestones, assignments, deadlines, and deliverables.</p></div>{canManageProjects && <button className={showProjectForm ? "crm-secondary-button" : "crm-primary-button"} onClick={() => setShowProjectForm(current => !current)}>{showProjectForm ? "Cancel" : "+ New project"}</button>}</div>
        {showProjectForm && <form className="project-create-form" onSubmit={createProject}><div><p className="crm-eyebrow">NEW PROJECT</p><h2>Start organized</h2><p>Connect the work to a customer and optionally load a repeatable task template.</p></div><label>Customer<select name="leadId" required defaultValue=""><option value="">Choose customer…</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.business} — {lead.project}</option>)}</select></label><label>Project template<select name="templateId" defaultValue=""><option value="">Blank project</option>{projectTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><label>Target date<input name="targetDate" type="date" /></label><div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowProjectForm(false)}>Cancel</button><button className="crm-primary-button">Create project</button></div></form>}
        {projectMessage && <p className="customer-message" role="status">{projectMessage}</p>}
        <div className="project-board">{(["planning","in_progress","client_review","complete"] as const).map(stage => { const stageProjects = projects.filter(project => project.status === stage); const labels = {planning:"PLANNING",in_progress:"IN PROGRESS",client_review:"CLIENT REVIEW",complete:"COMPLETE"}; return <section key={stage}><header><span>{labels[stage]}</span><b>{stageProjects.length}</b></header>{stageProjects.length ? stageProjects.map(project => { const lead = leads.find(item => item.id === project.leadId); const tasks = projectTasks.filter(task => task.projectId === project.id); const done = tasks.filter(task => task.status === "done").length; return <article key={project.id} className={selectedProject?.id === project.id ? "selected-project" : ""} onClick={() => { setSelectedProjectId(project.id); setSelectedId(project.leadId); }}><small>{project.currentPhase}</small><h3>{lead?.business || `Project #${project.id}`}</h3><p>{lead?.project || project.clientSummary}</p><div className="project-card-progress"><span><i style={{width:`${project.progress}%`}} /></span><b>{project.progress}%</b></div><div><span>Tasks</span><b>{done}/{tasks.length} complete</b><span>Target</span><b>{project.targetDate || "Not set"}</b></div></article>; }) : <div className="project-empty"><span>{stage === "complete" ? "✓" : "◇"}</span><p>No projects here.</p></div>}</section>; })}</div>
        {selectedProject && selectedProjectLead && <section className="project-detail-workspace"><header><div><button onClick={() => { setSelectedProjectId(null); setSelectedId(null); }}>← All projects</button><p className="crm-eyebrow">PROJECT #{selectedProject.id}</p><h2>{selectedProjectLead.business}</h2><p>{selectedProjectLead.project} · {selectedProjectLead.name}</p></div><div><button onClick={() => openCustomer(selectedProjectLead.id)}>Open customer</button><a href={`/portal?project=${selectedProjectLead.id}`} target="_blank" rel="noreferrer">Open client view ↗</a></div></header>
          <div className="project-detail-summary"><article><span>PROGRESS</span><strong>{selectedProject.progress}%</strong><i><b style={{width:`${selectedProject.progress}%`}} /></i></article><article><span>CURRENT PHASE</span><strong>{selectedProject.currentPhase}</strong><small>{selectedProject.nextStep}</small></article><article><span>TARGET DATE</span><strong>{selectedProject.targetDate || "Not scheduled"}</strong><small>{selectedProjectTasks.filter(task => task.dueDate && task.status !== "done").length} dated tasks open</small></article><article><span>WORKLOAD</span><strong>{selectedProjectTasks.filter(task => task.status !== "done").length} open</strong><small>{selectedProjectTasks.filter(task => task.priority === "urgent" && task.status !== "done").length} urgent</small></article></div>
          <div className="project-detail-grid"><section className="project-task-panel"><div className="project-panel-head"><div><p className="crm-eyebrow">WORK PLAN</p><h3>Milestones & tasks</h3></div>{canManageProjects && <button className="crm-primary-button" onClick={() => setShowTaskForm(current => !current)}>{showTaskForm ? "Cancel" : "+ Add task"}</button>}</div>
            {!selectedProjectTasks.length && <div className="project-template-picker"><h4>Start with a template</h4><p>Load a repeatable checklist, then customize it for this customer.</p><div>{projectTemplates.map(template => <button key={template.id} onClick={() => applyTemplate(template.id)}><b>{template.name}</b><small>{template.description}</small><span>Use template →</span></button>)}</div></div>}
            {showTaskForm && <form className="task-create-form" onSubmit={createTask}><label>Task title<input name="title" required autoFocus placeholder="Build homepage draft" /></label><label>Milestone<input name="milestone" required defaultValue="Build" /></label><label>Assigned to<select name="assignedEmployeeId" defaultValue=""><option value="">Unassigned</option>{employees.filter(employee => employee.status === "active").map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></label><label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Due date<input name="dueDate" type="date" /></label><label className="task-description">Description<textarea name="description" rows={3} /></label><label className="portal-check"><input name="visibleToClient" type="checkbox" /><span>Visible in client portal</span></label><label className="portal-check"><input name="clientApprovalRequired" type="checkbox" /><span>Client approval required</span></label><div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="crm-primary-button">Add task</button></div></form>}
            <div className="milestone-list">{Array.from(new Set(selectedProjectTasks.map(task => task.milestone))).map(milestone => { const tasks = selectedProjectTasks.filter(task => task.milestone === milestone); return <section key={milestone}><header><div><b>{milestone}</b><small>{tasks.filter(task => task.status === "done").length}/{tasks.length} complete</small></div><span>{Math.round(tasks.filter(task => task.status === "done").length / tasks.length * 100)}%</span></header>{tasks.map(task => { const assignee = taskAssignee(task); return <article key={task.id} className={`task-row ${task.status === "done" ? "is-done" : ""}`}><button className="task-check" aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={() => updateTask(task,{status:task.status === "done" ? "todo" : "done"})}>{task.status === "done" ? "✓" : ""}</button><div><b>{task.title}</b><small>{task.description || "No description"}{task.visibleToClient ? " · Client visible" : ""}{task.clientApprovalRequired ? " · Approval required" : ""}</small></div><em className={`priority-${task.priority}`}>{task.priority}</em><select aria-label={`Assign ${task.title}`} value={task.assignedEmployeeId || ""} disabled={!canManageProjects} onChange={event => updateTask(task,{assignedEmployeeId:Number(event.target.value) || null})}><option value="">Unassigned</option>{employees.filter(employee => employee.status === "active").map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select><input aria-label={`Due date for ${task.title}`} type="date" value={task.dueDate || ""} disabled={!canManageProjects} onChange={event => updateTask(task,{dueDate:event.target.value || null})} /><select aria-label={`Status for ${task.title}`} value={task.status} onChange={event => updateTask(task,{status:event.target.value})}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="review">Review</option><option value="done">Done</option></select><span>{assignee ? `${assignee.firstName} ${assignee.lastName}` : "Needs owner"}</span></article>; })}</section>; })}</div>
          </section>
          <aside className="project-settings-panel"><form onSubmit={updateProject}><p className="crm-eyebrow">PROJECT CONTROL</p><h3>Status & next step</h3><label>Status<select name="status" defaultValue={selectedProject.status}><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="client_review">Client review</option><option value="complete">Complete</option><option value="on_hold">On hold</option></select></label><label>Current phase<input name="currentPhase" defaultValue={selectedProject.currentPhase} /></label><label>Next step<input name="nextStep" defaultValue={selectedProject.nextStep} /></label><label>Target date<input name="targetDate" type="date" defaultValue={selectedProject.targetDate || ""} /></label><label>Client-facing summary<textarea name="clientSummary" rows={5} defaultValue={selectedProject.clientSummary} /></label>{canManageProjects && <button className="crm-primary-button">Save project</button>}</form><div className="project-linked-records"><button onClick={() => openCustomer(selectedProjectLead.id)}><span>◎</span><div><small>CUSTOMER</small><b>{selectedProjectLead.business}</b></div></button><button onClick={() => { setSelectedId(selectedProjectLead.id); openView("billing"); }}><span>$</span><div><small>BILLING</small><b>{billingDocuments.filter(document => document.leadId === selectedProjectLead.id).length} documents</b></div></button><button onClick={() => openDocuments(selectedProjectLead.id)}><span>▤</span><div><small>FILES</small><b>Project documents</b></div></button></div></aside></div>
        </section>}
        {selected && <section className="portal-manager"><header><div><p className="crm-eyebrow">CLIENT EXPERIENCE</p><h2>{selected.business} client portal</h2><p>Post updates and request the exact files needed to keep work moving.</p></div><a href={`/portal?project=${selected.id}`} target="_blank" rel="noreferrer">Open client view ↗</a></header>
          {portalMessage && <p className="portal-manager-message" role="status">{portalMessage}</p>}
          <div className="portal-manager-grid">
            <form onSubmit={event => portalAction(event,"updateProject")}><h3>Project status</h3><label>Status<select name="status" defaultValue="planning"><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="client_review">Client review</option><option value="complete">Complete</option><option value="on_hold">On hold</option></select></label><label>Progress<input name="progress" type="range" min="0" max="100" defaultValue="10" /><small>0–100% complete</small></label><label>Current phase<input name="currentPhase" defaultValue="Planning & discovery" /></label><label>Next step<input name="nextStep" defaultValue="Confirm project requirements" /></label><label>Target date<input name="targetDate" type="date" /></label><label>Client-facing summary<textarea name="clientSummary" rows={4} defaultValue="We are getting your project organized and ready for the next step." /></label><button className="crm-primary-button">Save client status</button></form>
            <form onSubmit={event => portalAction(event,"addUpdate")}><h3>Post an update</h3><label>Headline<input name="title" required placeholder="Homepage draft is ready" /></label><label>Message<textarea name="message" rows={5} required placeholder="Explain what changed and what happens next…" /></label><label className="portal-check"><input name="visibleToClient" type="checkbox" defaultChecked /><span>Visible to the client</span></label><button className="crm-primary-button">Post update</button></form>
            <form onSubmit={event => portalAction(event,"requestFile")}><h3>Request a file</h3><label>What do you need?<input name="title" required placeholder="Logo files" /></label><label>Instructions<textarea name="description" rows={4} placeholder="Upload the highest-resolution version available…" /></label><label>Category<select name="category"><option value="photo">Photos</option><option value="content">Website content</option><option value="brand">Brand or logo files</option><option value="contract">Contract or form</option><option value="other">Other</option></select></label><label>Due date<input name="dueDate" type="date" /></label><label className="portal-check"><input name="required" type="checkbox" defaultChecked /><span>Required to continue the project</span></label><button className="crm-primary-button">Send request</button></form>
          </div>
        </section>}
      </div>}

      {view === "tasks" && <div className="portal-page tasks-workspace"><div className="portal-page-head"><div><p className="crm-eyebrow">MY WORK</p><h1>Tasks</h1><p>See assigned work across every customer, ordered by urgency and deadline.</p></div><button className="crm-primary-button" onClick={() => openView("projects")}>Open project board</button></div>
        <nav className="task-filter-tabs"><button className={taskFilter === "mine" ? "active" : ""} onClick={() => setTaskFilter("mine")}>My tasks</button>{canManageProjects && <><button className={taskFilter === "open" ? "active" : ""} onClick={() => setTaskFilter("open")}>All open</button><button className={taskFilter === "unassigned" ? "active" : ""} onClick={() => setTaskFilter("unassigned")}>Unassigned</button><button className={taskFilter === "completed" ? "active" : ""} onClick={() => setTaskFilter("completed")}>Completed</button></>}</nav>
        <div className="task-stats"><article><span>DUE / OVERDUE</span><strong>{projectTasks.filter(task => task.status !== "done" && task.dueDate && task.dueDate <= new Date().toISOString().slice(0,10)).length}</strong></article><article><span>IN PROGRESS</span><strong>{projectTasks.filter(task => task.status === "in_progress").length}</strong></article><article><span>BLOCKED</span><strong>{projectTasks.filter(task => task.status === "blocked").length}</strong></article><article><span>UNASSIGNED</span><strong>{projectTasks.filter(task => !task.assignedEmployeeId && task.status !== "done").length}</strong></article></div>
        <section className="all-task-list"><header><span>TASK</span><span>PROJECT</span><span>ASSIGNEE</span><span>DUE</span><span>PRIORITY</span><span>STATUS</span></header>{projectTasks.filter(task => {
          if (taskFilter === "mine") return actor?.employeeId ? task.assignedEmployeeId === actor.employeeId && task.status !== "done" : task.status !== "done";
          if (taskFilter === "unassigned") return !task.assignedEmployeeId && task.status !== "done";
          if (taskFilter === "completed") return task.status === "done";
          return task.status !== "done";
        }).sort((a,b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).map(task => { const project = projects.find(item => item.id === task.projectId); const lead = project ? leads.find(item => item.id === project.leadId) : null; const assignee = taskAssignee(task); return <article key={task.id}><button className="task-check" onClick={() => updateTask(task,{status:task.status === "done" ? "todo" : "done"})}>{task.status === "done" ? "✓" : ""}</button><button className="task-title-link" onClick={() => { if(project){ setSelectedProjectId(project.id); setSelectedId(project.leadId); openView("projects"); } }}><b>{task.title}</b><small>{task.milestone}</small></button><button onClick={() => { if(project){ setSelectedProjectId(project.id); setSelectedId(project.leadId); openView("projects"); } }}><b>{lead?.business || "Unknown project"}</b><small>{lead?.project}</small></button><span>{assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned"}</span><time className={task.dueDate && task.dueDate < new Date().toISOString().slice(0,10) && task.status !== "done" ? "overdue" : ""}>{task.dueDate || "No date"}</time><em className={`priority-${task.priority}`}>{task.priority}</em><select value={task.status} onChange={event => updateTask(task,{status:event.target.value})}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="review">Review</option><option value="done">Done</option></select></article>; })}</section>
      </div>}

      {view === "employees" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">PEOPLE & ACCESS</p><h1>Employees</h1><p>Profiles, onboarding, permissions, pay setup, and employment records.</p></div><button className={showEmployeeForm ? "crm-secondary-button" : "crm-primary-button"} onClick={() => setShowEmployeeForm(!showEmployeeForm)}>{showEmployeeForm ? "Cancel" : "+ Add employee"}</button></div>
        {showEmployeeForm && <form className="employee-create" onSubmit={addEmployee}>
          <div><label>First name<input name="firstName" required /></label><label>Last name<input name="lastName" required /></label><label>Work email<input name="email" type="email" required /></label><label>Start date<input name="startDate" type="date" required /></label></div>
          <div><label>Job title<input name="jobTitle" /></label><label>Department<input name="department" defaultValue="General" /></label><label>Access role<select name="role"><option value="employee">Employee</option><option value="support">Support / Technician</option><option value="sales">Sales</option><option value="manager">Manager</option><option value="admin">Admin</option><option value="owner">Owner</option></select></label><label>Employment<select name="employmentType"><option value="hourly">Hourly</option><option value="salary">Salary</option><option value="contractor">Contractor</option></select></label></div>
          <div><label>Pay rate<input name="payRate" type="number" min="0" step=".01" placeholder="0.00" /></label><label>Pay frequency<select name="payFrequency"><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="semimonthly">Twice monthly</option><option value="monthly">Monthly</option></select></label><div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowEmployeeForm(false)}>Cancel</button><button className="crm-primary-button" type="submit">Create employee profile</button></div></div>
        </form>}
        <div className="people-summary"><article><span>ACTIVE PEOPLE</span><strong>{employees.filter(e => e.status === "active").length}</strong></article><article><span>ONBOARDING ITEMS</span><strong>{employees.reduce((n,e) => n + Number(!e.taxFormsComplete) + Number(!e.directDepositComplete) + Number(!e.handbookComplete), 0)}</strong></article><article><span>PAYROLL READY</span><strong>{employees.filter(e => e.taxFormsComplete && e.directDepositComplete).length}</strong></article></div>
        <section className="people-table"><header><span>EMPLOYEE</span><span>ROLE & ACCESS</span><span>EMPLOYMENT</span><span>ONBOARDING</span><span>STATUS</span></header>
          {employees.length ? employees.map(employee => <article key={employee.id} className="employee-row" role="button" tabIndex={0} onClick={() => setSelectedEmployeeId(employee.id)} onKeyDown={event => { if (event.key === "Enter") setSelectedEmployeeId(employee.id); }}><div className="person-cell"><i>{employee.firstName[0]}{employee.lastName[0]}</i><span><b>{employee.preferredName || employee.firstName} {employee.lastName}</b><small>{employee.email}</small></span></div><div><b>{employee.jobTitle || "Team member"}</b><small>{employee.role} · {employee.department}</small></div><div><b>{employee.employmentType}</b><small>{employee.payFrequency} · {employee.payRateCents ? `$${(employee.payRateCents / 100).toLocaleString()}` : "Rate not set"}</small></div><div className="checklist-mini"><span className={employee.taxFormsComplete ? "done" : ""}>Tax forms</span><span className={employee.directDepositComplete ? "done" : ""}>Deposit</span><span className={employee.handbookComplete ? "done" : ""}>Handbook</span></div><div className="employee-open"><em>{employee.status}</em><span>Open →</span></div></article>) : <div className="friendly-empty"><span>+</span><h3>Add your first employee.</h3><p>Create a secure profile with role, pay setup, onboarding status, and timekeeping access.</p></div>}
        </section>
        {selectedEmployee && <div className="employee-detail">
          <div className="employee-detail-head"><button onClick={() => setSelectedEmployeeId(null)}>← All employees</button><div><i>{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</i><span><p className="crm-eyebrow">EMPLOYEE #{selectedEmployee.id}</p><h2>{selectedEmployee.preferredName || selectedEmployee.firstName} {selectedEmployee.lastName}</h2><small>{selectedEmployee.jobTitle || "Team member"} · {selectedEmployee.department}</small></span></div><button className="detail-close" onClick={() => setSelectedEmployeeId(null)}>×</button></div>
          <div className="employee-detail-grid">
            <section><h3>Onboarding checklist</h3><p>Click an item to mark it complete or reopen it.</p>
              {[["taxFormsComplete","Tax forms","W-4 or contractor tax documentation"],["directDepositComplete","Direct deposit","Payroll payment information"],["handbookComplete","Employee handbook","Policies acknowledged"]].map(([key,title,copy]) => { const done = Boolean(selectedEmployee[key as keyof Employee]); return <button className={`onboarding-task ${done ? "done" : ""}`} key={key} onClick={() => updateEmployee({ [key]: !done } as Partial<Employee>)}><i>{done ? "✓" : ""}</i><span><b>{title}</b><small>{copy}</small></span><em>{done ? "Complete" : "Mark complete"}</em></button>; })}
            </section>
            <section><h3>Employment & access</h3><div className="employee-fields"><label>Job title<input value={selectedEmployee.jobTitle} onChange={event => setEmployees(current => current.map(e => e.id === selectedEmployee.id ? {...e, jobTitle:event.target.value} : e))} onBlur={event => updateEmployee({jobTitle:event.target.value})} /></label><label>Department<input value={selectedEmployee.department} onChange={event => setEmployees(current => current.map(e => e.id === selectedEmployee.id ? {...e, department:event.target.value} : e))} onBlur={event => updateEmployee({department:event.target.value})} /></label><label>Access role<select value={selectedEmployee.role} onChange={event => updateEmployee({role:event.target.value})}><option value="employee">Employee</option><option value="support">Support / Technician</option><option value="sales">Sales</option><option value="manager">Manager</option><option value="admin">Admin</option><option value="owner">Owner</option></select></label><label>Status<select value={selectedEmployee.status} onChange={event => updateEmployee({status:event.target.value})}><option value="active">Active</option><option value="leave">On leave</option><option value="inactive">Inactive</option></select></label></div><div className="account-access-card"><b>Business Hutch account</b><p>The employee’s email is their username. Send a secure link to create or reset their password.</p><div><button className="crm-primary-button" onClick={() => employeeAccountAction("send")}>Send setup / reset link</button><button className="crm-secondary-button" onClick={() => employeeAccountAction("remove")}>Remove account access</button></div>{employeeAccountMessage && <small role="status">{employeeAccountMessage}</small>}</div></section>
            <section><h3>Payroll setup</h3><div className="employee-fields"><label>Employment type<select value={selectedEmployee.employmentType} onChange={event => updateEmployee({employmentType:event.target.value})}><option value="hourly">Hourly</option><option value="salary">Salary</option><option value="contractor">Contractor</option></select></label><label>Pay frequency<select value={selectedEmployee.payFrequency} onChange={event => updateEmployee({payFrequency:event.target.value})}><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="semimonthly">Twice monthly</option><option value="monthly">Monthly</option></select></label><label>Pay rate<input type="number" step=".01" value={selectedEmployee.payRateCents / 100} onChange={event => setEmployees(current => current.map(e => e.id === selectedEmployee.id ? {...e, payRateCents:Math.round(Number(event.target.value)*100)} : e))} onBlur={event => updateEmployee({payRateCents:Math.round(Number(event.target.value)*100)})} /></label><label>PTO balance (hours)<input type="number" step=".25" value={(selectedEmployee.ptoMinutes || 0) / 60} onChange={event => updateEmployee({ptoMinutes:Math.round(Number(event.target.value)*60)} as Partial<Employee>)} /></label></div></section>
          </div>
        </div>}
      </div>}

      {view === "timecards" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">TIME & PAYROLL</p><h1>Timecards</h1><p>Review hours, exceptions, approvals, and payroll-period totals.</p></div><button className="crm-primary-button">Export payroll</button></div>
        <div className="clock-workspace"><div><p className="crm-eyebrow">EMPLOYEE TIME CLOCK</p><h2>{activeEntry ? "Shift in progress" : "Ready to work?"}</h2><p>{activeEntry ? `Clocked in at ${new Date(activeEntry.clockIn).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "Clock in to begin recording time."}</p></div>{canManage && !actor?.employeeId ? <label>Employee<select value={clockEmployeeId || ""} onChange={event => setClockEmployeeId(Number(event.target.value) || null)}><option value="">Choose employee…</option>{employees.filter(e => e.status === "active").map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></label> : <div className="clock-identity"><small>TIMEKEEPING AS</small><b>{actor?.name || "Employee"}</b></div>}<div className="clock-actions">{activeEntry && <button className="break-button" onClick={() => timeAction(activeEntry.breakStartedAt ? "endBreak" : "startBreak", activeEntry)}>{activeEntry.breakStartedAt ? "End break" : "Start break"}</button>}<button className={activeEntry ? "clock-button clock-out" : "clock-button"} disabled={!clockEmployeeId} onClick={() => timeAction(activeEntry ? "clockOut" : "clockIn")}>{activeEntry ? "Clock out" : "Clock in"}</button></div>{timeMessage && <small>{timeMessage}</small>}</div>
        <div className="payroll-banner"><div><span>CURRENT PAY PERIOD</span><b>Hours ready for review</b><small>Approved records can be exported to a payroll provider.</small></div><div><strong>{timeEntries.length}</strong><span>ENTRIES</span></div><div><strong>{timeEntries.filter(e => e.status === "approved").length}</strong><span>APPROVED</span></div><button>Review exceptions</button></div>
        <section className="timecard-table"><header><span>EMPLOYEE</span><span>DATE</span><span>IN / OUT</span><span>BREAK</span><span>TOTAL</span><span>STATUS</span></header>
          {timeEntries.length ? timeEntries.map(entry => { const hours = entry.clockOut ? Math.max(0, (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / 3600000 - entry.breakMinutes / 60) : 0; return <article key={entry.id}><b>{entry.firstName} {entry.lastName}</b><span>{new Date(entry.clockIn).toLocaleDateString()}</span><span>{new Date(entry.clockIn).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})} — {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : entry.breakStartedAt ? "On break" : "Active"}{entry.correctionStatus === "pending" && <small className="exception-tag"> Correction pending</small>}</span><span>{entry.breakMinutes} min</span><b>{entry.clockOut ? `${hours.toFixed(2)} hrs` : "—"}</b><div className="time-status"><em>{entry.status}</em>{entry.clockOut && entry.status !== "approved" && <button onClick={() => setCorrectionEntry(entry)}>Correct</button>}{entry.clockOut && canManage && <button onClick={() => timeAction(entry.status === "approved" ? "reopen" : "approve", entry)}>{entry.status === "approved" ? "Reopen" : "Approve"}</button>}{canManage && entry.correctionStatus === "pending" && <><button onClick={() => timeAction("applyCorrection", entry)}>Apply</button><button onClick={() => timeAction("denyCorrection", entry)}>Deny</button></>}</div></article>; }) : <div className="friendly-empty"><span>◷</span><h3>No time entries yet.</h3><p>Employee clock-ins will appear here for manager review and payroll export.</p></div>}
        </section>
        <div className="time-tools-grid"><section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">TIME OFF</p><h2>Requests</h2></div></div><form className="compact-form" onSubmit={submitPto}>{canManage && <select name="employeeId" required defaultValue=""><option value="">Employee…</option>{employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>}<select name="type"><option value="pto">PTO</option><option value="sick">Sick</option><option value="unpaid">Unpaid</option></select><input name="startDate" type="date" required /><input name="endDate" type="date" required /><input name="minutes" type="number" min="0" placeholder="Minutes requested" /><input name="reason" placeholder="Optional note" /><button className="crm-primary-button">Submit request</button></form><div className="request-list">{ptoRequests.map(request => <article key={request.id}><div><b>{request.firstName} {request.lastName}</b><small>{request.startDate} – {request.endDate} · {request.type.toUpperCase()}</small></div><em>{request.status}</em>{canManage && request.status === "pending" && <span><button onClick={() => reviewPto(request.id,"approve")}>Approve</button><button onClick={() => reviewPto(request.id,"deny")}>Deny</button></span>}</article>)}</div></section><section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">UPCOMING</p><h2>Schedule</h2></div><button onClick={() => openView("calendar")}>Full schedule →</button></div><div className="request-list">{schedules.slice(0,5).map(shift => <article key={shift.id}><div><b>{shift.firstName} {shift.lastName}</b><small>{shift.shiftDate} · {shift.startTime}–{shift.endTime}</small></div><em>{shift.location}</em></article>)}</div></section></div>
      </div>}

      {view === "calendar" && <div className="portal-page calendar-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">CONNECTED BUSINESS CALENDAR</p><h1>Calendar</h1><p>See work schedules, appointments, project deadlines, follow-ups, PTO, and billing dates together.</p></div>{canManage && <button className="crm-primary-button" onClick={() => setShowEventForm(current => !current)}>{showEventForm ? "Cancel" : "+ Add event"}</button>}</div>
        {showEventForm && <form className="calendar-event-form" onSubmit={addCalendarEvent}><label>Event title<input name="title" required placeholder="Project kickoff" /></label><label>Type<select name="eventType"><option value="appointment">Appointment</option><option value="meeting">Meeting</option><option value="deadline">Deadline</option><option value="onsite">Onsite visit</option><option value="reminder">Reminder</option></select></label><label>Starts<input name="startAt" type="datetime-local" required /></label><label>Ends<input name="endAt" type="datetime-local" /></label><label>Assign to<select name="assignedEmployeeId" defaultValue=""><option value="">Whole team</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></label><label>Customer<select name="leadId" defaultValue=""><option value="">No customer</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.business}</option>)}</select></label><label>Location<input name="location" placeholder="Remote or address" /></label><label>Visibility<select name="visibility"><option value="team">Team</option><option value="assigned">Assigned employee only</option></select></label><label className="calendar-note">Notes<input name="note" placeholder="Agenda, preparation, or instructions" /></label><label className="calendar-all-day"><input type="checkbox" name="allDay" /> All-day event</label><button className="crm-primary-button">Save event</button></form>}
        <section className="calendar-toolbar"><div><button onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1))}>←</button><button onClick={() => setCalendarCursor(new Date())}>Today</button><button onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1))}>→</button><h2>{calendarCursor.toLocaleDateString([],{month:"long",year:"numeric"})}</h2></div><div><select value={calendarType} onChange={event => setCalendarType(event.target.value)}><option value="all">All items</option><option value="shift">Shifts</option><option value="appointment">Appointments</option><option value="meeting">Meetings</option><option value="task">Tasks</option><option value="project">Projects</option><option value="follow_up">Follow-ups</option><option value="billing">Billing</option><option value="pto">PTO</option></select><button className={calendarMode === "month" ? "active" : ""} onClick={() => setCalendarMode("month")}>Month</button><button className={calendarMode === "agenda" ? "active" : ""} onClick={() => setCalendarMode("agenda")}>Agenda</button></div></section>
        {calendarMode === "month" ? <section className="business-calendar"><header>{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(day => <span key={day}>{day}</span>)}</header><div>{calendarDays.map(day => {const iso=day.toISOString().slice(0,10);const items=filteredCalendarItems.filter(item => item.start.slice(0,10) === iso);return <article key={iso} className={`${day.getMonth() !== calendarCursor.getMonth() ? "outside" : ""} ${iso === new Date().toISOString().slice(0,10) ? "today" : ""}`}><time>{day.getDate()}</time>{items.slice(0,4).map(item => <button key={item.key} className={`calendar-chip ${item.type}`} title={`${item.title} — ${item.detail}`}><i />{item.title}</button>)}{items.length > 4 && <small>+{items.length-4} more</small>}</article>;})}</div></section> : <section className="calendar-agenda">{filteredCalendarItems.length ? filteredCalendarItems.map(item => <article key={item.key}><time><b>{new Date(`${item.start.slice(0,10)}T12:00:00`).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}</b><span>{item.allDay ? "All day" : item.start.slice(11,16)}</span></time><i className={item.type} /><div><b>{item.title}</b><small>{item.detail}</small></div><em>{item.type.replaceAll("_"," ")}</em></article>) : <div className="friendly-empty"><span>□</span><h3>No calendar items found.</h3><p>Try another filter or add an event.</p></div>}</section>}
        <div className="calendar-lower-grid"><section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">EMPLOYEE COVERAGE</p><h2>Add a shift</h2></div></div>{canManage ? <form className="schedule-form" onSubmit={addSchedule}><select name="employeeId" required defaultValue=""><option value="">Choose employee…</option>{employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select><input name="shiftDate" type="date" required /><input name="startTime" type="time" required /><input name="endTime" type="time" required /><input name="location" placeholder="Location" defaultValue="Remote" /><input name="note" placeholder="Shift note" /><button className="crm-primary-button">Add shift</button></form> : <p>Your assigned shifts are included on the calendar above.</p>}</section><section className="hub-panel"><div className="hub-panel-head"><div><p className="crm-eyebrow">REMINDERS</p><h2>Notification rules</h2></div></div><ul className="notification-rules"><li><b>Overdue and due soon</b><span>Tasks, invoices, follow-ups, and project targets appear automatically.</span></li><li><b>Personal access</b><span>Employees see their shifts, PTO, assignments, and team events.</span></li><li><b>Manager view</b><span>Owners and admins see company-wide coverage and deadlines.</span></li></ul></section></div>
      </div>}

      {view === "documents" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">CUSTOMER & PROJECT RECORDS</p><h1>Project files</h1><p>Upload, open, and download customer photos, contracts, content, and deliverables. Billing records stay in Quotes &amp; invoices.</p></div><button className={showProjectUpload ? "crm-secondary-button" : "crm-primary-button"} onClick={() => setShowProjectUpload(current => !current)}>{showProjectUpload ? "Cancel" : "+ Upload file"}</button></div>
        {showProjectUpload && <form className="project-file-upload" onSubmit={uploadProjectFile}><input type="hidden" name="leadId" value={projectUploadCustomer} /><label>Customer<select required value={projectUploadCustomer} onChange={event => setProjectUploadCustomer(event.target.value)}><option value="">Choose customer…</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.business} — {lead.name}</option>)}</select></label><label>File<input name="file" type="file" required accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" /></label><label>Category<select name="category"><option value="photo">Photo</option><option value="content">Content</option><option value="brand">Brand / logo</option><option value="contract">Contract / form</option><option value="deliverable">Deliverable</option><option value="other">Other</option></select></label><label>Note<input name="caption" placeholder="What this file is or where it belongs" /></label><div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowProjectUpload(false)}>Cancel</button><button className="crm-primary-button">Upload file</button></div></form>}
        {projectFileMessage && <p className="billing-message" role="status">{projectFileMessage}</p>}
        <div className="file-sort-tools"><label>Customer<select value={projectFileCustomer} onChange={event => setProjectFileCustomer(event.target.value)}><option value="all">All customers</option>{leads.map(lead=><option key={lead.id} value={lead.id}>{lead.business} — {lead.name}</option>)}</select></label><label>Sort by<select value={projectFileSort} onChange={event => setProjectFileSort(event.target.value as typeof projectFileSort)}><option value="date">Upload date</option><option value="filename">File name</option><option value="customer">Customer</option><option value="category">Category</option><option value="size">File size</option></select></label><button onClick={() => setProjectFileDirection(current => current === "asc" ? "desc" : "asc")}>{projectFileDirection === "asc" ? "Ascending ↑" : "Descending ↓"}</button></div>
        <section className="document-library"><header><span>FILE</span><span>CUSTOMER</span><span>UPLOADED</span><span>SIZE</span><span>CATEGORY</span><span>OPEN</span></header>
          {sortedProjectFiles.length ? sortedProjectFiles.map(file => { const project = projects.find(item => item.id === file.projectId); const customer = leads.find(lead => lead.id === project?.leadId); return <article key={file.id}><div><b>{file.filename}</b><small>{file.caption || `Uploaded by ${file.uploadedByName}`}</small></div><button onClick={() => customer && openCustomer(customer.id)}><b>{customer?.business || "Unknown customer"}</b><small>{customer ? "Open customer →" : "Project record"}</small></button><span>{new Date(file.createdAt).toLocaleDateString()}</span><b>{Math.max(1,Math.round(file.sizeBytes/1024))} KB</b><em>{file.category}</em><a href={`/api/client-portal/files/${file.id}`} target="_blank" rel="noreferrer">Open / download ↗</a></article>; }) : <div className="friendly-empty"><span>▤</span><h3>No project files found.</h3><p>Upload a file here or receive one through the client portal. Estimates and invoices are managed in Billing.</p></div>}
        </section>
        <div className="storage-architecture-note"><b>BUILT TO SCALE</b><p>Customer relationships, permissions, and searchable details live in the database. File contents use secure object storage so large uploads do not overload business records.</p></div>
      </div>}

      {view === "library" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">EMPLOYEE-ONLY COMPANY KNOWLEDGE</p><h1>Internal Library</h1><p>SOPs, policies, training, templates, pricing references, HR forms, and troubleshooting guides—kept separate from customer files.</p></div>{canManageLibrary && <button className={showInternalUpload ? "crm-secondary-button" : "crm-primary-button"} onClick={() => setShowInternalUpload(current => !current)}>{showInternalUpload ? "Cancel" : "+ Add document"}</button>}</div>
        {showInternalUpload && <form className="internal-upload-form" onSubmit={uploadInternalDocument}>
          <div><label>Title<input name="title" required placeholder="Website launch checklist" /></label><label>Folder<input name="folder" required defaultValue="Operations" /></label><label>Category<select name="category"><option value="sop">SOP / work instruction</option><option value="policy">Policy</option><option value="training">Training</option><option value="template">Template</option><option value="sales">Sales / pricing</option><option value="hr">HR / payroll</option><option value="it">IT reference</option><option value="reference">General reference</option></select></label><label>Access<select name="visibility"><option value="all_employees">All employees</option><option value="managers">Managers and leads</option><option value="owner_admin">Owner and admin only</option></select></label></div>
          <div><label className="internal-description">Description<textarea name="description" rows={3} placeholder="What this document covers and when employees should use it." /></label><label>Link to task<select name="linkedTaskId" defaultValue=""><option value="">No task link</option>{projectTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label>File<input name="file" type="file" required /></label><label className="acknowledgment-check"><input name="requiresAcknowledgment" type="checkbox" /> Require employee acknowledgment</label></div>
          <div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowInternalUpload(false)}>Cancel</button><button className="crm-primary-button">Upload document</button></div>
        </form>}
        {libraryMessage && <p className="billing-message" role="status">{libraryMessage}</p>}
        <div className="internal-library-tools"><label>Search<input value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="Search titles, folders, categories…" /></label><label>Folder<select value={libraryFolder} onChange={event => setLibraryFolder(event.target.value)}><option value="all">All folders</option>{libraryFolders.map(folder => <option key={folder}>{folder}</option>)}</select></label><label>Status<select value={libraryStatus} onChange={event => setLibraryStatus(event.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select></label><label>Sort by<select value={librarySort} onChange={event => setLibrarySort(event.target.value as typeof librarySort)}><option value="updated">Updated</option><option value="title">Title</option><option value="folder">Folder</option><option value="access">Access</option><option value="version">Version</option></select></label><button onClick={() => setLibrarySortDirection(current => current === "asc" ? "desc" : "asc")}>{librarySortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}</button></div>
        <section className="internal-library-list">
          <header><span>DOCUMENT</span><span>FOLDER / CATEGORY</span><span>ACCESS</span><span>VERSION</span><span>UPDATED</span><span>ACTIONS</span></header>
          {visibleInternalDocuments.length ? visibleInternalDocuments.map(document => {
            const versions = internalVersions.filter(version => version.documentId === document.id).sort((a,b) => b.version-a.version);
            const currentVersion = versions.find(version => version.version === document.currentVersion);
            const acknowledged = documentAcknowledgments.some(item => item.documentId === document.id && item.employeeId === actor?.employeeId && item.version === document.currentVersion);
            return <article key={document.id} className={document.status === "archived" ? "is-archived" : ""}>
              <button className="internal-document-title" onClick={() => setExpandedInternalDocumentId(current => current === document.id ? null : document.id)} aria-expanded={expandedInternalDocumentId === document.id}><b>{document.title}</b><small>{document.description || "No description"}</small></button>
              <div><b>{document.folder}</b><small>{document.category.replaceAll("_"," ")}</small></div>
              <em>{document.visibility.replaceAll("_"," ")}</em><span>v{document.currentVersion}</span><time>{new Date(document.updatedAt).toLocaleDateString()}</time>
              <div className="internal-document-actions">{currentVersion && <a href={`/api/internal-documents/files/${currentVersion.id}`} target="_blank" rel="noreferrer">Open ↗</a>}{document.requiresAcknowledgment && !acknowledged && actor?.employeeId && <button onClick={() => acknowledgeInternalDocument(document)}>Acknowledge</button>}{document.requiresAcknowledgment && acknowledged && <small>✓ Acknowledged</small>}{canManageLibrary && <button onClick={() => setInternalDocumentArchive(document)}>{document.status === "archived" ? "Restore" : "Archive"}</button>}</div>
              {expandedInternalDocumentId === document.id && <section className="internal-version-panel"><div><b>Version history</b><span>{versions.length} saved version{versions.length === 1 ? "" : "s"}</span></div>{versions.map(version => <a key={version.id} href={`/api/internal-documents/files/${version.id}`} target="_blank" rel="noreferrer"><span><b>v{version.version} · {version.filename}</b><small>{version.changeNote || "Initial upload"} · {Math.max(1,Math.round(version.sizeBytes/1024))} KB · {new Date(version.createdAt).toLocaleDateString()}</small></span><em>Open ↗</em></a>)}{canManageLibrary && <form className="internal-version-upload" onSubmit={uploadInternalDocument}><input type="hidden" name="documentId" value={document.id} /><input type="hidden" name="title" value={document.title} /><label>New version<input name="file" type="file" required /></label><label>What changed?<input name="changeNote" required placeholder="Updated approval steps" /></label><button className="crm-secondary-button">Add version</button></form>}{document.linkedTaskId && <button onClick={() => { const task=projectTasks.find(item=>item.id===document.linkedTaskId); if(task){setSelectedProjectId(task.projectId);openView("projects");} }}>Open linked task →</button>}</section>}
            </article>;
          }) : <div className="friendly-empty"><span>▥</span><h3>No internal documents found.</h3><p>{canManageLibrary ? "Add the first SOP, policy, training guide, or reusable template." : "No documents match these filters."}</p></div>}
        </section>
        <div className="storage-architecture-note"><b>PRIVATE BY DESIGN</b><p>Actual files are stored securely outside the record database. The database keeps searchable details, permissions, versions, acknowledgments, task links, and audit history.</p></div>
      </div>}

      {view === "messages" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">CLIENT COMMUNICATION</p><h1>Messages</h1><p>Keep questions and replies attached to the correct customer and project.</p></div></div>
        <div className="staff-message-workspace">
          <aside><label>Conversation<select value={selectedId || ""} onChange={event => setSelectedId(Number(event.target.value) || null)}><option value="">Choose a customer…</option>{projectRecords.map(lead => <option key={lead.id} value={lead.id}>{lead.business} — {lead.project}</option>)}</select></label>{selected && <div><span>CUSTOMER</span><b>{selected.name}</b><small>{selected.email}</small><button onClick={() => openProject(selected.id)}>Open project →</button></div>}</aside>
          <section>
            {selected ? <><header><div><p className="crm-eyebrow">{selected.business}</p><h2>{selected.project}</h2></div><a href={`/portal?project=${selected.id}`} target="_blank" rel="noreferrer">Open client portal ↗</a></header><div className="staff-chat-thread">{projectMessages.length ? projectMessages.map(item => <article key={item.id} className={item.senderType === "staff" ? "from-team" : "from-client"}><div><b>{item.senderType === "staff" ? item.senderName : selected.name}</b><time>{new Date(item.createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></div><p>{item.message}</p></article>) : <div className="friendly-empty"><span>✉</span><h3>No messages yet.</h3><p>Start the project conversation below.</p></div>}</div><form className="staff-chat-form" onSubmit={sendStaffMessage}><textarea name="message" rows={3} maxLength={4000} required placeholder={`Message ${selected.name}…`} /><button className="crm-primary-button">Send message</button></form>{portalMessage && <p className="portal-manager-message" role="status">{portalMessage}</p>}</> : <div className="friendly-empty"><span>✉</span><h3>Choose a conversation.</h3><p>Select a customer to view and reply to project messages.</p></div>}
          </section>
        </div>
      </div>}

      {view === "reports" && <div className="portal-page reports-page">
        <header className="report-print-cover">
          <div><p>PIXEL HUTCH BUSINESS HUTCH</p><h1>Business performance report</h1><span>{reportRangeLabel} · {reportCustomerLabel}</span></div>
          <aside><b>{new Date().toLocaleDateString([], {month:"long",day:"numeric",year:"numeric"})}</b><span>Prepared from live Business Hutch records</span></aside>
        </header>
        <div className="portal-page-head"><div><p className="crm-eyebrow">BUSINESS INTELLIGENCE</p><h1>Reports &amp; analytics</h1><p>See where work, customers, and money stand—using the records already connected across the Business Hutch.</p></div><div className="report-head-actions"><button className="crm-secondary-button" onClick={() => window.print()}>Print / Save PDF</button><button className="crm-primary-button" onClick={exportReport}>Export CSV</button></div></div>
        <section className="report-controls">
          <label>Date range<select value={reportRange} onChange={event => setReportRange(event.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="all">All time</option></select></label>
          <label>Customer<select value={reportCustomer} onChange={event => setReportCustomer(event.target.value)}><option value="all">All customers</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.business || lead.name}</option>)}</select></label>
          <div><span>REPORTING AS OF</span><b>{new Date().toLocaleDateString([], {month:"long",day:"numeric",year:"numeric"})}</b></div>
        </section>
        <nav className="report-tabs" aria-label="Report categories">{([["overview","Overview"],["sales","Sales"],["finance","Finance"],["projects","Projects"],["team","Team"],["customers","Customers"]] as const).filter(([id]) => canManage || !["finance","team"].includes(id)).map(([id,label]) => <button key={id} className={reportTab === id ? "active" : ""} onClick={() => setReportTab(id)}>{label}</button>)}</nav>

        {(reportTab === "overview" || reportTab === "finance") && <div className="report-kpis">
          <article><span>INVOICED</span><strong>${(totalInvoiced/100).toLocaleString(undefined,{maximumFractionDigits:0})}</strong><small>{reportBilling.filter(document => document.kind === "invoice" && document.status !== "void").length} active invoice records</small></article>
          <article><span>COLLECTED</span><strong>${(totalCollected/100).toLocaleString(undefined,{maximumFractionDigits:0})}</strong><small>{collectionRate}% of invoiced revenue</small></article>
          <article className={totalOutstanding ? "attention" : ""}><span>OUTSTANDING</span><strong>${(totalOutstanding/100).toLocaleString(undefined,{maximumFractionDigits:0})}</strong><small>{reportBilling.filter(document => document.kind === "invoice" && document.status !== "void" && document.paidCents < document.totalCents).length} open balances</small></article>
          <article><span>PIPELINE</span><strong>${reportLeads.filter(lead => !["won","lost"].includes(lead.status)).reduce((sum,lead) => sum+lead.estimatedValue,0).toLocaleString()}</strong><small>estimated open opportunity</small></article>
        </div>}

        {(reportTab === "overview" || reportTab === "finance") && <section className="report-card report-financial-visual">
          <header><div><p className="crm-eyebrow">CASH POSITION</p><h2>Revenue collection</h2></div><strong>{collectionRate}%<small> collected</small></strong></header>
          <div className="revenue-track" aria-label={`${collectionRate}% of invoiced revenue collected`}><span style={{width:`${collectionRate}%`}} /></div>
          <div className="revenue-legend">
            <article><i className="collected-dot"/><span>Collected</span><b>${(totalCollected/100).toLocaleString(undefined,{maximumFractionDigits:0})}</b></article>
            <article><i className="outstanding-dot"/><span>Outstanding</span><b>${(totalOutstanding/100).toLocaleString(undefined,{maximumFractionDigits:0})}</b></article>
            <article><i className="pipeline-dot"/><span>Open pipeline</span><b>${reportLeads.filter(lead => !["won","lost"].includes(lead.status)).reduce((sum,lead) => sum+lead.estimatedValue,0).toLocaleString()}</b></article>
          </div>
        </section>}

        {(reportTab === "overview" || reportTab === "sales") && <div className="report-grid">
          <section className="report-card"><header><div><p className="crm-eyebrow">SALES FUNNEL</p><h2>Lead pipeline</h2></div><strong>{conversionRate}%<small> conversion</small></strong></header><div className="report-bars funnel-bars">{stageBreakdown.map((item,index) => <article key={item.label}><span>{item.label}</span><i><b style={{width:`${item.value/reportMax*100}%`,"--bar-index":index} as CSSProperties} /></i><strong>{item.value}</strong></article>)}</div></section>
          <section className="report-card"><header><div><p className="crm-eyebrow">SALES HEALTH</p><h2>Opportunity summary</h2></div></header><div className="metric-list"><article><span>New leads</span><b>{reportLeads.filter(lead => lead.status === "new").length}</b></article><article><span>Proposals open</span><b>{reportLeads.filter(lead => lead.status === "proposal").length}</b></article><article><span>Won customers</span><b>{wonLeads}</b></article><article><span>Average opportunity</span><b>${Math.round(reportLeads.reduce((sum,lead)=>sum+lead.estimatedValue,0)/Math.max(1,reportLeads.length)).toLocaleString()}</b></article></div></section>
        </div>}

        {(reportTab === "overview" || reportTab === "projects") && <div className="report-grid">
          <section className="report-card"><header><div><p className="crm-eyebrow">DELIVERY</p><h2>Project status</h2></div><strong>{reportProjects.length}<small> projects</small></strong></header><div className="report-bars project-bars">{projectBreakdown.map((item,index) => <article key={item.label}><span>{item.label}</span><i><b style={{width:`${item.value/reportMax*100}%`,"--bar-index":index} as CSSProperties} /></i><strong>{item.value}</strong></article>)}</div></section>
          <section className="report-card"><header><div><p className="crm-eyebrow">WORK COMPLETION</p><h2>Task health</h2></div><strong>{taskCompletion}%</strong></header><div className="task-health-visual"><div className="completion-ring" style={{"--progress":`${taskCompletion*3.6}deg`} as CSSProperties}><span><b>{completedTasks}</b><small>of {reportTasks.length} done</small></span></div><div className="task-health-legend"><article><i className="done-dot"/><span>Completed</span><b>{completedTasks}</b></article><article><i className="open-dot"/><span>Open</span><b>{openTaskCount}</b></article><article><i className="blocked-dot"/><span>Blocked</span><b>{blockedTaskCount}</b></article><article><i className="overdue-dot"/><span>Overdue</span><b>{overdueTaskCount}</b></article></div></div></section>
        </div>}

        {reportTab === "finance" && canManage && <section className="report-table"><header><span>DOCUMENT</span><span>CUSTOMER</span><span>INVOICED</span><span>PAID</span><span>BALANCE</span><span>STATUS</span></header>{reportBilling.filter(document=>document.kind==="invoice").sort((a,b)=>b.issueDate.localeCompare(a.issueDate)).map(document=><article key={document.id}><a href={`/crm/billing/${document.id}`} target="_blank" rel="noreferrer">{document.number} ↗</a><span>{document.customerBusiness||document.customerName}</span><b>${(document.totalCents/100).toFixed(2)}</b><span>${(document.paidCents/100).toFixed(2)}</span><b>${(Math.max(0,document.totalCents-document.paidCents)/100).toFixed(2)}</b><em>{document.status}</em></article>)}</section>}

        {reportTab === "team" && canManage && <><div className="report-kpis team-kpis"><article><span>TRACKED HOURS</span><strong>{trackedHours.toFixed(1)}</strong><small>completed time entries</small></article><article><span>APPROVED ENTRIES</span><strong>{reportTime.filter(entry=>entry.status==="approved").length}</strong><small>ready for payroll</small></article><article><span>ACTIVE EMPLOYEES</span><strong>{employees.filter(employee=>employee.status==="active").length}</strong><small>current team members</small></article><article><span>OPEN ASSIGNMENTS</span><strong>{reportTasks.filter(task=>task.status!=="done").length}</strong><small>tasks remaining</small></article></div><section className="report-table team-table"><header><span>EMPLOYEE</span><span>DEPARTMENT</span><span>HOURS</span><span>OPEN TASKS</span><span>COMPLETED</span><span>STATUS</span></header>{employees.map(employee=>{const entries=reportTime.filter(entry=>entry.employeeId===employee.id);const hours=entries.reduce((sum,entry)=>entry.clockOut?sum+Math.max(0,(new Date(entry.clockOut).getTime()-new Date(entry.clockIn).getTime())/3600000-entry.breakMinutes/60):sum,0);const tasks=reportTasks.filter(task=>task.assignedEmployeeId===employee.id);return <article key={employee.id}><b>{employee.firstName} {employee.lastName}</b><span>{employee.department}</span><b>{hours.toFixed(1)}</b><span>{tasks.filter(task=>task.status!=="done").length}</span><span>{tasks.filter(task=>task.status==="done").length}</span><em>{employee.status}</em></article>})}</section></>}

        {reportTab === "customers" && <section className="report-table customer-report-table"><header><span>CUSTOMER</span><span>STAGE</span><span>PROJECT</span><span>INVOICED</span><span>PAID</span><span>OPEN BALANCE</span></header>{reportLeads.sort((a,b)=>(a.business||a.name).localeCompare(b.business||b.name)).map(lead=>{const docs=reportBilling.filter(document=>document.leadId===lead.id&&document.kind==="invoice"&&document.status!=="void");const invoiced=docs.reduce((sum,document)=>sum+document.totalCents,0);const paid=docs.reduce((sum,document)=>sum+document.paidCents,0);return <article key={lead.id}><button onClick={()=>openCustomer(lead.id)}><b>{lead.business||lead.name}</b><small>{lead.name}</small></button><em>{lead.status}</em><span>{lead.project}</span><b>${(invoiced/100).toFixed(2)}</b><span>${(paid/100).toFixed(2)}</span><b>${((invoiced-paid)/100).toFixed(2)}</b></article>})}</section>}
      </div>}

      {view === "settings" && <div className="portal-page settings-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">BUSINESS HUTCH CONTROL CENTER</p><h1>Settings</h1><p>Control company identity, billing rules, alerts, client access, and employee permissions from one place.</p></div>{settings?.updatedAt && <div className="settings-last-saved"><span>LAST UPDATED</span><b>{new Date(settings.updatedAt).toLocaleString()}</b><small>{settings.updatedBy}</small></div>}</div>
        {!canManage && <div className="settings-restricted"><span>⚙</span><div><b>Owner or admin access required</b><p>You can review the current company preferences, but only an Owner or Admin can change business-wide settings.</p></div></div>}
        {settings ? <form className="settings-workspace" onSubmit={saveSettings} style={{"--settings-accent":settings.accentColor} as CSSProperties}>
          <nav aria-label="Settings categories">{([["company","Company"],["services","Services & pricing"],["billing","Billing"],["notifications","Notifications"],["portal","Client portal"],["access","Roles & access"]] as const).map(([id,label]) => <button type="button" key={id} className={settingsTab === id ? "active" : ""} onClick={() => setSettingsTab(id)}><span>{id === "company" ? "⌂" : id === "services" ? "◇" : id === "billing" ? "$" : id === "notifications" ? "◉" : id === "portal" ? "◎" : "♙"}</span>{label}</button>)}</nav>
          <div className="settings-content">
            <section className={settingsTab === "company" ? "active" : ""}><header><p className="crm-eyebrow">COMPANY & BRAND</p><h2>Business identity</h2><p>Used on documents, client pages, emails, and reports.</p></header><div className="settings-grid">
              <label>Display name<input name="companyName" required defaultValue={settings.companyName} disabled={!canManage} /></label><label>Legal business name<input name="legalName" defaultValue={settings.legalName} disabled={!canManage} /></label>
              <label>Support email<input name="supportEmail" type="email" required defaultValue={settings.supportEmail} disabled={!canManage} /></label><label>Phone<input name="phone" defaultValue={settings.phone} disabled={!canManage} /></label>
              <label>Website<input name="website" type="url" defaultValue={settings.website} disabled={!canManage} /></label><label>Business address<input name="address" defaultValue={settings.address} disabled={!canManage} /></label>
              <label>Timezone<select name="timezone" defaultValue={settings.timezone} disabled={!canManage}><option value="America/Phoenix">Arizona — America/Phoenix</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option><option value="America/Chicago">Central Time</option><option value="America/New_York">Eastern Time</option></select></label><label>Accent color<div className="color-setting"><input name="accentColor" type="color" defaultValue={settings.accentColor} disabled={!canManage} /><span>{settings.accentColor}</span></div></label>
            </div></section>
            <section className={settingsTab === "services" ? "active" : ""}><header><p className="crm-eyebrow">SERVICE CATALOG</p><h2>Services & pricing</h2><p>These are the approved choices shown when a customer is created. Standard prices fill automatically and cannot be overridden.</p></header>
              <div className="service-catalog-settings">{serviceCatalog.map((item,index)=><article key={item.id}><label>Service name<input value={item.name} disabled={!canManage} onChange={event=>setServiceCatalog(current=>current.map((entry,i)=>i===index?{...entry,name:event.target.value}:entry))} /></label><label>Standard price<input type="number" min="0" step=".01" value={item.priceCents/100} disabled={!canManage} onChange={event=>setServiceCatalog(current=>current.map((entry,i)=>i===index?{...entry,priceCents:Math.round(Number(event.target.value||0)*100)}:entry))} /></label><label className="service-active"><input type="checkbox" checked={item.active} disabled={!canManage} onChange={event=>setServiceCatalog(current=>current.map((entry,i)=>i===index?{...entry,active:event.target.checked}:entry))} /> Active</label>{canManage&&<button type="button" onClick={()=>setServiceCatalog(current=>current.filter((_,i)=>i!==index))}>Remove</button>}</article>)}</div>
              {canManage&&<button type="button" className="crm-secondary-button" onClick={()=>setServiceCatalog(current=>[...current,{id:`service-${Date.now()}`,name:"",priceCents:0,active:true}])}>+ Add service</button>}
              <div className="access-safety-note"><b>Custom pricing rule</b><p>Only Owners and Admins can enter a custom service and price. Sales staff can use active catalog services at their approved prices.</p></div>
            </section>
            <section className={settingsTab === "billing" ? "active" : ""}><header><p className="crm-eyebrow">DOCUMENT & PAYMENT DEFAULTS</p><h2>Billing rules</h2><p>These defaults are applied when new estimates and invoices are created.</p></header><div className="settings-grid">
              <label>Estimate number prefix<input name="estimatePrefix" maxLength={8} defaultValue={settings.estimatePrefix} disabled={!canManage} /></label><label>Invoice number prefix<input name="invoicePrefix" maxLength={8} defaultValue={settings.invoicePrefix} disabled={!canManage} /></label>
              <label>Default payment terms<input name="paymentTermsDays" type="number" min="0" max="365" defaultValue={settings.paymentTermsDays} disabled={!canManage} /><small>Days after issue</small></label><label>Estimate expiration<input name="estimateExpirationDays" type="number" min="0" max="365" defaultValue={settings.estimateExpirationDays} disabled={!canManage} /><small>Days after issue</small></label>
              <label>Default tax rate<input name="defaultTaxRate" type="number" min="0" max="100" step=".01" defaultValue={settings.defaultTaxRate/100} disabled={!canManage} /><small>Percent</small></label><label>Default project deposit<input name="defaultDepositPercent" type="number" min="0" max="100" defaultValue={settings.defaultDepositPercent} disabled={!canManage} /><small>Percent</small></label>
              <label>Currency<select name="currency" defaultValue={settings.currency} disabled={!canManage}><option value="USD">USD — US Dollar</option><option value="CAD">CAD — Canadian Dollar</option><option value="EUR">EUR — Euro</option></select></label>
            </div><div className="settings-example"><span>DOCUMENT PREVIEW</span><b>{settings.invoicePrefix}-{new Date().getFullYear()}-0001</b><small>Prefixes affect new documents only. Existing records keep their original numbers.</small></div></section>
            <section className={settingsTab === "notifications" ? "active" : ""}><header><p className="crm-eyebrow">ALERT PREFERENCES</p><h2>Notifications</h2><p>Choose which business events create alerts and how early reminders appear.</p></header><div className="settings-toggle-list">
              <label><span><b>New lead alerts</b><small>Notify authorized team members when a website inquiry creates a lead.</small></span><input name="notifyNewLeads" type="checkbox" defaultChecked={settings.notifyNewLeads} disabled={!canManage} /></label>
              <label><span><b>Client message alerts</b><small>Notify the assigned team when a client sends a project message.</small></span><input name="notifyClientMessages" type="checkbox" defaultChecked={settings.notifyClientMessages} disabled={!canManage} /></label>
              <label><span><b>Overdue invoice alerts</b><small>Keep unpaid balances visible in the notification center.</small></span><input name="notifyOverdueInvoices" type="checkbox" defaultChecked={settings.notifyOverdueInvoices} disabled={!canManage} /></label>
            </div><div className="settings-grid compact"><label>Task reminders<input name="taskReminderDays" type="number" min="0" max="30" defaultValue={settings.taskReminderDays} disabled={!canManage} /><small>Days before due date</small></label><label>Invoice reminders<input name="invoiceReminderDays" type="number" min="0" max="30" defaultValue={settings.invoiceReminderDays} disabled={!canManage} /><small>Days before due date</small></label></div></section>
            <section className={settingsTab === "portal" ? "active" : ""}><header><p className="crm-eyebrow">CUSTOMER EXPERIENCE</p><h2>Client portal</h2><p>Control which tools and project details clients can use after they sign in.</p></header><div className="settings-toggle-list">
              <label><span><b>Show project progress</b><small>Display phase, completion percentage, next step, and target date.</small></span><input name="clientShowProgress" type="checkbox" defaultChecked={settings.clientShowProgress} disabled={!canManage} /></label>
              <label><span><b>Show client-visible tasks</b><small>Only tasks intentionally marked client-visible are included.</small></span><input name="clientShowTasks" type="checkbox" defaultChecked={settings.clientShowTasks} disabled={!canManage} /></label>
              <label><span><b>Allow file uploads</b><small>Clients can respond to requests with photos, documents, and project assets.</small></span><input name="clientAllowUploads" type="checkbox" defaultChecked={settings.clientAllowUploads} disabled={!canManage} /></label>
              <label><span><b>Allow project messaging</b><small>Clients and employees can use the shared project conversation.</small></span><input name="clientAllowMessages" type="checkbox" defaultChecked={settings.clientAllowMessages} disabled={!canManage} /></label>
            </div></section>
            <section className={settingsTab === "access" ? "active" : ""}><header><p className="crm-eyebrow">ACCESS MANAGEMENT & TEST MODE</p><h2>Roles, accounts, and safe testing</h2><p>Employee access stays tied to verified email accounts. Owner-only Test Mode lets you check restricted views without permanently changing your account.</p></header>
              {actor?.actualRole === "owner" && <div className="access-test-grid">
                <div><span>VIEW AS EMPLOYEE ROLE</span><h3>Test internal permissions</h3><p>Temporarily hide Owner tools and experience the Hub with another role&apos;s server-enforced access.</p><label>Role<select value={testRole} onChange={event => setTestRole(event.target.value)}><option value="admin">Admin</option><option value="manager">Manager</option><option value="sales">Sales</option><option value="support">Support / Technician</option><option value="employee">Employee</option></select></label><button type="button" className="crm-secondary-button" onClick={startRoleTest}>Start role test</button></div>
                <div><span>TEST CLIENT ACCOUNT</span><h3>Open a customer portal</h3><p>Use your Owner identity to enter one customer&apos;s portal as a client. Staff-only controls will be removed.</p><label>Customer<select value={testLeadId} onChange={event => setTestLeadId(event.target.value)}><option value="">Choose a test customer…</option>{leads.map(lead=><option key={lead.id} value={lead.id}>{lead.business} — {lead.name}</option>)}</select></label><button type="button" className="crm-primary-button" onClick={startClientTest}>Log in as test client</button></div>
              </div>}
              {testAccessMessage && <p className="customer-message" role="status">{testAccessMessage}</p>}
              <div className="role-matrix"><header><span>ROLE</span><span>CUSTOMERS</span><span>PROJECTS</span><span>BILLING</span><span>TEAM / SETTINGS</span></header>{[["Owner","Full","Full","Full + cancel","Full"],["Admin","Full","Full","Full + cancel","Full"],["Manager","Operational view","Full","View","Team"],["Sales","Create & edit","Create & edit","Create & edit","No"],["Support","View","Create & edit","No","No"],["Employee","Assigned only","Assigned tasks","No","No"]].map(row => <article key={row[0]}>{row.map((cell,index) => index ? <span key={cell}>{cell}</span> : <b key={cell}>{cell}</b>)}</article>)}</div><button type="button" className="crm-secondary-button" onClick={() => openView("employees")}>Manage employee accounts →</button>
              <div className="access-safety-note"><b>How access stays safe</b><ul><li>Only the Owner can start Test Mode.</li><li>Test sessions expire automatically after two hours.</li><li>A persistent banner shows whenever another role is active.</li><li>Starting and ending test sessions is recorded in the Activity Log.</li><li>Suspending an employee blocks their Business Hutch access immediately.</li></ul></div>
            </section>
            {canManage && <footer><div>{settingsMessage && <p role="status">{settingsMessage}</p>}<small>Settings changes are recorded in the Activity Log.</small></div><button className="crm-primary-button">Save all settings</button></footer>}
          </div>
        </form> : <div className="friendly-empty"><span>⚙</span><h3>Loading settings…</h3></div>}
      </div>}

      {view === "activity" && canManage && <div className="portal-page"><div className="portal-page-head"><div><p className="crm-eyebrow">OWNER & ADMIN ONLY</p><h1>Activity log</h1><p>A read-only record of sign-ins, edits, approvals, timekeeping, and permission changes.</p></div></div><section className="activity-table"><header><span>WHO</span><span>ACTION</span><span>DETAIL</span><span>WHEN</span></header>{activity.map(item => <article key={item.id}><div><b>{item.actorName}</b><small>{item.actorRole} · {item.actorEmail}</small></div><em>{item.action.replaceAll("."," ")}</em><p>{item.summary}</p><time>{new Date(item.createdAt).toLocaleString()}</time></article>)}</section></div>}
      {view === "activity" && !canManage && <div className="portal-page module-page"><p className="crm-eyebrow">RESTRICTED</p><div className="module-icon">◉</div><h1>Activity log</h1><p>Only owners and administrators can view employee activity history.</p><button className="crm-primary-button" onClick={() => setView("dashboard")}>Back to dashboard</button></div>}

      {view === "billing" && <div className="portal-page">
        <div className="portal-page-head"><div><p className="crm-eyebrow">SALES & ACCOUNTS RECEIVABLE</p><h1>Quotes & invoices</h1><p>Create estimates, collect deposits, track balances, and manage recurring support plans.</p></div><button className={showBillingForm ? "crm-secondary-button" : "crm-primary-button"} disabled={!leads.length} title={!leads.length ? "Add a customer first" : undefined} onClick={() => setShowBillingForm(!showBillingForm)}>{showBillingForm ? "Cancel" : "+ New document"}</button></div>
        {!leads.length && <div className="customer-first-notice"><span>◎</span><div><b>Add a customer before creating billing documents.</b><p>Every estimate and invoice must be connected to a customer record so projects, files, messages, and payments stay tied together.</p></div><button className="crm-primary-button" onClick={() => openView("customers")}>Add customer</button></div>}
        <div className="billing-stats"><article><span>OUTSTANDING</span><strong>${(billingDocuments.filter(d => d.kind === "invoice" && ["sent","accepted","partial","overdue"].includes(d.status)).reduce((s,d) => s + d.totalCents - d.paidCents, 0) / 100).toLocaleString()}</strong></article><article><span>DRAFTS</span><strong>{billingDocuments.filter(d => d.status === "draft").length}</strong></article><article><span>PAID / RECEIPTS</span><strong>${(billingDocuments.reduce((s,d) => s + d.paidCents, 0) / 100).toLocaleString()}</strong></article><article><span>RECURRING</span><strong>{billingDocuments.filter(d => d.recurring).length}</strong></article></div>
        {showBillingForm && <form className="billing-create" onSubmit={createBillingDocument}>
          <div><label>Type<select name="kind"><option value="estimate">Estimate</option><option value="invoice">Invoice</option></select></label><label>Customer<select name="leadId" required defaultValue=""><option value="">Choose existing customer…</option>{leads.map(l=><option key={l.id} value={l.id}>{l.business} — {l.name}</option>)}</select></label><div className="billing-customer-rule"><b>Customer record required</b><span>Contact and business details are pulled from the selected customer automatically.</span></div></div>
          <section className="quote-line-items">
            <header><div><span>QUOTE LINE ITEMS</span><p>Choose from the same approved service catalog used when customers are created.</p></div><button type="button" className="crm-secondary-button" onClick={addQuoteLine}>+ Add line</button></header>
            {quoteLineItems.map((line,index) => <article key={line.id}>
              <span className="quote-line-number">{index + 1}</span>
              <label>Service<select required value={line.serviceId} onChange={event=>chooseQuoteService(line.id,event.target.value)}><option value="">Choose a service…</option>{serviceCatalog.filter(item=>item.active).map(item=><option key={item.id} value={item.id}>{item.name} — ${(item.priceCents/100).toLocaleString(undefined,{minimumFractionDigits:2})}</option>)}{canManage&&<option value="custom">Custom project</option>}</select></label>
              <label>Description<input required value={line.description} readOnly={line.serviceId !== "custom"} placeholder={line.serviceId === "custom" ? "Describe the custom work" : "Choose a service"} onChange={event=>updateQuoteLine(line.id,{description:event.target.value})} /></label>
              <label>Quantity<input type="number" min="1" step="1" value={line.quantity} onChange={event=>updateQuoteLine(line.id,{quantity:Math.max(1,Number(event.target.value||1))})} /></label>
              <label>Rate<input type="number" min="0" step=".01" value={(line.rateCents/100).toFixed(2)} readOnly={line.serviceId !== "custom"} onChange={event=>updateQuoteLine(line.id,{rateCents:Math.round(Number(event.target.value||0)*100)})} /></label>
              <strong>${((line.quantity * line.rateCents)/100).toLocaleString(undefined,{minimumFractionDigits:2})}</strong>
              <button type="button" className="quote-remove-line" disabled={quoteLineItems.length === 1} onClick={()=>removeQuoteLine(line.id)} aria-label={`Remove line ${index+1}`}>×</button>
            </article>)}
            {!canManage&&<small>Custom services and manual pricing require Owner or Admin access.</small>}
          </section>
          <div className="billing-adjustments"><label>Discount<input name="discount" type="number" min="0" step=".01" defaultValue="0" /></label><label>Tax rate %<input name="taxRate" type="number" min="0" step=".01" defaultValue={(settings?.defaultTaxRate || 0)/100} /></label><div><span>ESTIMATED TOTAL</span><b>${((quoteLineItems.reduce((sum,line)=>sum+line.quantity*line.rateCents,0))/100).toLocaleString(undefined,{minimumFractionDigits:2})}</b><small>Before discount and tax</small></div></div>
          <div><label>Issue date<input name="issueDate" type="date" defaultValue={new Date(pageOpenedAt).toISOString().slice(0,10)} /></label><label>Due date<input name="dueDate" type="date" defaultValue={new Date(pageOpenedAt+(settings?.paymentTermsDays || 14)*86400000).toISOString().slice(0,10)} /></label><label>Frequency<select name="recurrence" defaultValue="one_time"><option value="one_time">One time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label><label>Notes<textarea name="notes" rows={2} /></label><div className="form-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowBillingForm(false)}>Cancel</button><button className="crm-primary-button">Create draft</button></div></div>
        </form>}
        {billingMessage && <p className="billing-message">{billingMessage}</p>}
        <nav className="billing-category-tabs" aria-label="Billing document categories">
          {([["open","Open invoices"],["estimates","Estimates"],["closed","Closed & paid"],["canceled","Canceled"]] as [BillingCategory,string][]).map(([category,label]) =>
            <button key={category} className={billingCategory === category ? "is-active" : ""} onClick={() => setBillingCategory(category)}>{label}<span>{billingCategoryCounts[category]}</span></button>
          )}
        </nav>
        <section className="billing-list"><header><button onClick={() => sortBilling("number")}>DOCUMENT{sortIndicator("number")}</button><button onClick={() => sortBilling("customer")}>CUSTOMER{sortIndicator("customer")}</button><div className="billing-date-sort"><button onClick={() => sortBilling("issueDate")}>ISSUED{sortIndicator("issueDate")}</button><button onClick={() => sortBilling("dueDate")}>DUE{sortIndicator("dueDate")}</button></div><button onClick={() => sortBilling("total")}>AMOUNT{sortIndicator("total")}</button><button onClick={() => sortBilling("status")}>STATUS{sortIndicator("status")}</button><span>ACTIONS</span></header>
          {visibleBillingDocuments.length ? visibleBillingDocuments.map(doc => <article key={doc.id} className={doc.status === "void" ? "is-canceled" : ""}><div><a className="document-number-link" href={`/crm/billing/${doc.id}`} target="_blank" rel="noreferrer"><b>{doc.number}</b><span aria-hidden="true">↗</span></a><small>{doc.kind} · {doc.recurring ? doc.recurrence : "one time"}</small></div><div>{doc.leadId ? <button className="linked-record-button" onClick={() => openCustomer(doc.leadId!)}><b>{doc.customerBusiness || doc.customerName}</b><small>Open customer →</small></button> : <><b>{doc.customerBusiness || doc.customerName}</b><small>{doc.customerEmail}</small></>}</div><div><span>{doc.issueDate}</span><small>{doc.dueDate ? `Due ${doc.dueDate}` : "No due date"}</small></div><div><b>${(doc.totalCents/100).toLocaleString(undefined,{minimumFractionDigits:2})}</b><small>${(doc.paidCents/100).toFixed(2)} paid</small></div><select aria-label={`Status for ${doc.number}`} value={doc.status} disabled={doc.status === "void"} onChange={e=>updateBillingStatus(doc.id,e.target.value)}>{doc.kind === "estimate" ? <><option value="draft">Draft</option><option value="sent">Pending decision</option><option value="accepted">Accept & convert to invoice</option><option value="declined">Declined</option></> : <><option value="draft">Draft</option><option value="sent">Open</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></>}{doc.status === "void" && <option value="void">Canceled</option>}</select><div className="billing-actions"><a className="open-document-button" href={`/crm/billing/${doc.id}`} target="_blank" rel="noreferrer">Open document ↗</a>{doc.leadId && <button className="open-document-button" onClick={() => openProject(doc.leadId!)}>View project →</button>}{doc.kind === "invoice" && doc.status !== "void" && <form className="payment-form" onSubmit={e=>recordPayment(e,doc.id)}><input name="amount" type="number" min=".01" step=".01" placeholder="Payment" aria-label="Payment amount" /><select name="method" aria-label="Payment method"><option value="card">Card</option><option value="ach">ACH</option><option value="cash">Cash</option><option value="check">Check</option><option value="other">Other</option></select><button>Record</button></form>}{canManage && doc.status !== "void" && <button className="danger-text-button" onClick={() => setDocumentToCancel(doc)}>Cancel document</button>}</div></article>) : <div className="friendly-empty"><span>$</span><h3>No documents in this category.</h3><p>{billingCategory === "open" ? "Accepted estimates become open invoices here automatically, alongside other unpaid invoices." : billingCategory === "estimates" ? "Draft and sent estimates awaiting acceptance or denial appear here." : billingCategory === "closed" ? "Paid invoices and declined estimates are kept here." : "Canceled documents are retained here for your audit trail."}</p></div>}
        </section>
        <div className="payment-security-note"><b>PAYMENT SECURITY</b><p>Future online payments will use a hosted Stripe checkout. Pixel Hutch will track the result without storing card numbers or bank credentials.</p></div>
      </div>}

      {correctionEntry && <div className="clock-prompt-backdrop"><form className="clock-prompt correction-form" onSubmit={requestCorrection}><p className="crm-eyebrow">MISSED PUNCH CORRECTION</p><h2>Request a time change</h2><label>Correct clock in<input name="clockIn" type="datetime-local" defaultValue={correctionEntry.clockIn.slice(0,16)} required /></label><label>Correct clock out<input name="clockOut" type="datetime-local" defaultValue={correctionEntry.clockOut?.slice(0,16)} required /></label><label>Reason<textarea name="reason" rows={3} required placeholder="Explain what needs to be corrected…" /></label><div><button className="crm-primary-button">Send request</button><button type="button" onClick={() => setCorrectionEntry(null)}>Cancel</button></div></form></div>}
      {documentToCancel && <div className="clock-prompt-backdrop"><section className="clock-prompt cancel-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-document-title"><span>!</span><p className="crm-eyebrow">OWNER / ADMIN ACTION</p><h2 id="cancel-document-title">Cancel {documentToCancel.number}?</h2><p>This removes the document from active billing totals but keeps it in the record and activity log. This action does not refund any recorded payment.</p><div><button className="danger-button" onClick={cancelBillingDocument}>Cancel document</button><button onClick={() => setDocumentToCancel(null)}>Keep document</button></div></section></div>}

      {comingSoon.has(view) && <div className="portal-page module-page"><p className="crm-eyebrow">PIXEL HUTCH BUSINESS HUTCH</p><div className="module-icon">{menu.find(item => item[0] === view)?.[1]}</div><h1>{menu.find(item => item[0] === view)?.[2]}</h1><p>This section is part of the approved Business Hutch roadmap. Its navigation is in place now, and we&apos;ll build the real workflow when this module comes up next.</p><button className="crm-primary-button" onClick={() => setView("dashboard")}>Back to dashboard</button></div>}
    </section>
  </main>;
}
