import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  business: text("business").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  project: text("project").notNull(),
  budget: text("budget").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  referral: text("referral").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  estimatedValue: integer("estimated_value").notNull().default(0),
  nextFollowUp: text("next_follow_up"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  jobTitle: text("job_title").notNull().default(""),
  department: text("department").notNull().default("General"),
  role: text("role").notNull().default("employee"),
  employmentType: text("employment_type").notNull().default("hourly"),
  payRateCents: integer("pay_rate_cents").notNull().default(0),
  payFrequency: text("pay_frequency").notNull().default("biweekly"),
  startDate: text("start_date").notNull(),
  status: text("status").notNull().default("active"),
  managerId: integer("manager_id"),
  emergencyName: text("emergency_name").notNull().default(""),
  emergencyPhone: text("emergency_phone").notNull().default(""),
  emergencyRelation: text("emergency_relation").notNull().default(""),
  address: text("address").notNull().default(""),
  taxFormsComplete: integer("tax_forms_complete", { mode: "boolean" }).notNull().default(false),
  directDepositComplete: integer("direct_deposit_complete", { mode: "boolean" }).notNull().default(false),
  handbookComplete: integer("handbook_complete", { mode: "boolean" }).notNull().default(false),
  ptoMinutes: integer("pto_minutes").notNull().default(0),
  sickMinutes: integer("sick_minutes").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull(),
  clockIn: text("clock_in").notNull(),
  clockOut: text("clock_out"),
  breakMinutes: integer("break_minutes").notNull().default(0),
  status: text("status").notNull().default("open"),
  note: text("note").notNull().default(""),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  breakStartedAt: text("break_started_at"),
  correctionClockIn: text("correction_clock_in"),
  correctionClockOut: text("correction_clock_out"),
  correctionReason: text("correction_reason").notNull().default(""),
  correctionStatus: text("correction_status").notNull().default("none"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const ptoRequests = sqliteTable("pto_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull(),
  type: text("type").notNull().default("pto"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  minutes: integer("minutes").notNull().default(0),
  reason: text("reason").notNull().default(""),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull(),
  shiftDate: text("shift_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull().default("Remote"),
  note: text("note").notNull().default(""),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  eventType: text("event_type").notNull().default("appointment"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at"),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  location: text("location").notNull().default(""),
  note: text("note").notNull().default(""),
  leadId: integer("lead_id"),
  projectId: integer("project_id"),
  assignedEmployeeId: integer("assigned_employee_id"),
  visibility: text("visibility").notNull().default("team"),
  status: text("status").notNull().default("scheduled"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notificationStates = sqliteTable("notification_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeEmail: text("employee_email").notNull(),
  notificationKey: text("notification_key").notNull(),
  readAt: text("read_at"),
  dismissedAt: text("dismissed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const businessSettings = sqliteTable("business_settings", {
  id: integer("id").primaryKey(),
  companyName: text("company_name").notNull().default("Pixel Hutch"),
  legalName: text("legal_name").notNull().default("Hutch & Son's LLC"),
  supportEmail: text("support_email").notNull().default("max@pixel-hutch.com"),
  phone: text("phone").notNull().default(""),
  website: text("website").notNull().default("https://pixel-hutch.com"),
  address: text("address").notNull().default("Phoenix, Arizona"),
  timezone: text("timezone").notNull().default("America/Phoenix"),
  currency: text("currency").notNull().default("USD"),
  estimatePrefix: text("estimate_prefix").notNull().default("EST"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  paymentTermsDays: integer("payment_terms_days").notNull().default(14),
  defaultTaxRate: integer("default_tax_rate").notNull().default(0),
  defaultDepositPercent: integer("default_deposit_percent").notNull().default(50),
  estimateExpirationDays: integer("estimate_expiration_days").notNull().default(30),
  taskReminderDays: integer("task_reminder_days").notNull().default(2),
  invoiceReminderDays: integer("invoice_reminder_days").notNull().default(3),
  notifyNewLeads: integer("notify_new_leads", { mode: "boolean" }).notNull().default(true),
  notifyClientMessages: integer("notify_client_messages", { mode: "boolean" }).notNull().default(true),
  notifyOverdueInvoices: integer("notify_overdue_invoices", { mode: "boolean" }).notNull().default(true),
  clientShowProgress: integer("client_show_progress", { mode: "boolean" }).notNull().default(true),
  clientShowTasks: integer("client_show_tasks", { mode: "boolean" }).notNull().default(true),
  clientAllowUploads: integer("client_allow_uploads", { mode: "boolean" }).notNull().default(true),
  clientAllowMessages: integer("client_allow_messages", { mode: "boolean" }).notNull().default(true),
  serviceCatalogJson: text("service_catalog_json").notNull().default("[]"),
  accentColor: text("accent_color").notNull().default("#f54702"),
  updatedBy: text("updated_by").notNull().default("system"),
  updatedAt: text("updated_at").notNull(),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorEmail: text("actor_email").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull().default(""),
  summary: text("summary").notNull(),
  createdAt: text("created_at").notNull(),
});

export const testAccessSessions = sqliteTable("test_access_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  ownerEmail: text("owner_email").notNull(),
  mode: text("mode").notNull(),
  role: text("role"),
  leadId: integer("lead_id"),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const billingDocuments = sqliteTable("billing_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull().default("estimate"),
  number: text("number").notNull().unique(),
  leadId: integer("lead_id"),
  customerName: text("customer_name").notNull(),
  customerBusiness: text("customer_business").notNull().default(""),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("draft"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date"),
  lineItemsJson: text("line_items_json").notNull().default("[]"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  paidCents: integer("paid_cents").notNull().default(0),
  recurring: integer("recurring", { mode: "boolean" }).notNull().default(false),
  recurrence: text("recurrence").notNull().default("monthly"),
  notes: text("notes").notNull().default(""),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  billingDocumentId: integer("billing_document_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull().default("other"),
  reference: text("reference").notNull().default(""),
  paidAt: text("paid_at").notNull(),
  recordedBy: text("recorded_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const clientProjects = sqliteTable("client_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().unique(),
  status: text("status").notNull().default("planning"),
  progress: integer("progress").notNull().default(10),
  currentPhase: text("current_phase").notNull().default("Planning & discovery"),
  nextStep: text("next_step").notNull().default("Confirm project requirements"),
  targetDate: text("target_date"),
  clientSummary: text("client_summary").notNull().default("We are getting your project organized and ready to begin."),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projectTasks = sqliteTable("project_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  milestone: text("milestone").notNull().default("General"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("normal"),
  assignedEmployeeId: integer("assigned_employee_id"),
  dueDate: text("due_date"),
  visibleToClient: integer("visible_to_client", { mode: "boolean" }).notNull().default(false),
  clientApprovalRequired: integer("client_approval_required", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projectTemplates = sqliteTable("project_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  tasksJson: text("tasks_json").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projectUpdates = sqliteTable("project_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  visibleToClient: integer("visible_to_client", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const projectMessages = sqliteTable("project_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name").notNull(),
  senderType: text("sender_type").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const fileRequests = sqliteTable("file_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("other"),
  required: integer("required", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("requested"),
  dueDate: text("due_date"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projectFiles = sqliteTable("project_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  requestId: integer("request_id"),
  uploadedByEmail: text("uploaded_by_email").notNull(),
  uploadedByName: text("uploaded_by_name").notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  category: text("category").notNull().default("other"),
  caption: text("caption").notNull().default(""),
  visibleToClient: integer("visible_to_client", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("uploaded"),
  createdAt: text("created_at").notNull(),
});

export const internalDocuments = sqliteTable("internal_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("reference"),
  folder: text("folder").notNull().default("General"),
  visibility: text("visibility").notNull().default("all_employees"),
  requiresAcknowledgment: integer("requires_acknowledgment", { mode: "boolean" }).notNull().default(false),
  linkedTaskId: integer("linked_task_id"),
  status: text("status").notNull().default("active"),
  currentVersion: integer("current_version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const internalDocumentVersions = sqliteTable("internal_document_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull(),
  version: integer("version").notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  changeNote: text("change_note").notNull().default(""),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const internalDocumentAcknowledgments = sqliteTable("internal_document_acknowledgments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  version: integer("version").notNull(),
  acknowledgedAt: text("acknowledged_at").notNull(),
});

export const authLoginTokens = sqliteTable("auth_login_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  returnTo: text("return_to").notNull().default("/"),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const employeePasswords = sqliteTable("employee_passwords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  iterations: integer("iterations").notNull().default(210000),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});
