export type FormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "number" | "textarea" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  help?: string;
};

export type FormTemplateSeed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  customerFacing: boolean;
  requiresSignature?: boolean;
  fields: FormField[];
};

const field = (id: string, label: string, type: FormField["type"] = "text", extra: Partial<FormField> = {}): FormField =>
  ({ id, label, type, ...extra });

export const formTemplateSeeds: FormTemplateSeed[] = [
  {
    slug: "client-contract", name: "Client Service Contract", category: "Agreement",
    description: "Project scope, responsibilities, payment terms, ownership, and acceptance.",
    customerFacing: true, requiresSignature: true,
    fields: [
      field("effectiveDate", "Effective date", "date", { required: true }),
      field("services", "Services and deliverables", "textarea", { required: true }),
      field("timeline", "Project timeline", "textarea", { required: true }),
      field("investment", "Project investment and payment terms", "textarea", { required: true }),
      field("clientResponsibilities", "Client responsibilities", "textarea"),
      field("revisions", "Revision allowance", "textarea"),
      field("termination", "Cancellation or termination terms", "textarea"),
      field("specialTerms", "Additional terms", "textarea"),
    ],
  },
  {
    slug: "asset-access-request", name: "Asset & Access Request", category: "Onboarding",
    description: "Collect website, domain, hosting, brand, content, analytics, and account access.",
    customerFacing: true,
    fields: [
      field("domainRegistrar", "Domain registrar"), field("domainAccess", "Domain access status", "select", { options: ["Ready to provide", "Need help locating", "Not applicable"] }),
      field("hostingProvider", "Current hosting provider"), field("websitePlatform", "Current website platform"),
      field("brandAssets", "Logo and brand asset status", "textarea"), field("contentAssets", "Copy, photo, and video status", "textarea"),
      field("analytics", "Analytics/Search Console access", "textarea"), field("businessListings", "Google Business and directory access", "textarea"),
      field("otherSystems", "Other systems or accounts", "textarea"), field("securityNotes", "Access or security notes", "textarea"),
    ],
  },
  {
    slug: "discovery-questionnaire", name: "Client Discovery Questionnaire", category: "Discovery",
    description: "Capture goals, audience, brand direction, features, competitors, content, and success measures.",
    customerFacing: true,
    fields: [
      field("businessOverview", "Tell us about the business", "textarea", { required: true }),
      field("primaryGoal", "Primary goal for this project", "textarea", { required: true }),
      field("audience", "Ideal customer or audience", "textarea", { required: true }),
      field("services", "Products or services to feature", "textarea"),
      field("differentiators", "What makes the business different?", "textarea"),
      field("brandDirection", "Desired look, feel, and personality", "textarea"),
      field("competitors", "Competitors or inspiration websites", "textarea"),
      field("features", "Required pages, features, or integrations", "textarea"),
      field("content", "Available copy, photos, video, and brand assets", "textarea"),
      field("success", "How will success be measured?", "textarea"),
    ],
  },
  {
    slug: "client-onboarding-checklist", name: "Client Onboarding Checklist", category: "Onboarding",
    description: "Track the handoff from signed agreement through kickoff readiness.",
    customerFacing: true,
    fields: [
      field("agreementSigned", "Agreement signed", "checkbox"), field("depositPaid", "Initial payment received", "checkbox"),
      field("primaryContactConfirmed", "Primary contact confirmed", "checkbox"), field("communicationMethod", "Preferred communication method", "select", { options: ["Email", "Phone", "Client portal", "Video meeting"] }),
      field("discoveryComplete", "Discovery questionnaire complete", "checkbox"), field("assetsReceived", "Assets and access received", "checkbox"),
      field("kickoffScheduled", "Kickoff meeting scheduled", "checkbox"), field("kickoffDate", "Kickoff date", "date"),
      field("outstandingItems", "Outstanding items", "textarea"),
    ],
  },
  {
    slug: "project-brief", name: "Project Brief", category: "Planning",
    description: "Create the shared source of truth for objectives, scope, audience, requirements, milestones, and risks.",
    customerFacing: true,
    fields: [
      field("summary", "Project summary", "textarea", { required: true }), field("objectives", "Objectives", "textarea", { required: true }),
      field("audience", "Target audience", "textarea"), field("scope", "Scope and deliverables", "textarea", { required: true }),
      field("outOfScope", "Out of scope", "textarea"), field("requirements", "Technical and functional requirements", "textarea"),
      field("milestones", "Milestones and target dates", "textarea"), field("stakeholders", "Stakeholders and decision makers", "textarea"),
      field("risks", "Risks, dependencies, and assumptions", "textarea"), field("approvalCriteria", "Completion and approval criteria", "textarea"),
    ],
  },
  {
    slug: "invoice-payment-schedule", name: "Invoice & Payment Schedule", category: "Billing",
    description: "Document deposits, milestone invoices, retainers, due dates, and payment expectations.",
    customerFacing: true, requiresSignature: true,
    fields: [
      field("totalInvestment", "Total project investment", "number", { required: true }),
      field("deposit", "Deposit amount and due date", "text"), field("milestoneOne", "Milestone payment 1", "text"),
      field("milestoneTwo", "Milestone payment 2", "text"), field("finalPayment", "Final payment", "text"),
      field("recurringFees", "Recurring fees", "textarea"), field("paymentMethods", "Accepted payment methods", "textarea"),
      field("lateTerms", "Late payment terms", "textarea"), field("notes", "Billing notes", "textarea"),
    ],
  },
  {
    slug: "website-audit", name: "Website Audit", category: "Audit",
    description: "Record findings and priorities for content, design, UX, performance, accessibility, SEO, and security.",
    customerFacing: true,
    fields: [
      field("siteUrl", "Website URL", "text", { required: true }), field("overallSummary", "Executive summary", "textarea"),
      field("contentFindings", "Content findings", "textarea"), field("designFindings", "Design and UX findings", "textarea"),
      field("mobileFindings", "Mobile and responsive findings", "textarea"), field("performanceFindings", "Performance findings", "textarea"),
      field("seoFindings", "SEO findings", "textarea"), field("accessibilityFindings", "Accessibility findings", "textarea"),
      field("securityFindings", "Security and maintenance findings", "textarea"), field("recommendations", "Prioritized recommendations", "textarea"),
    ],
  },
  {
    slug: "website-launch-approval", name: "Website Launch Approval", category: "Approval",
    description: "Confirm final review, launch authorization, domain changes, and post-launch responsibilities.",
    customerFacing: true, requiresSignature: true,
    fields: [
      field("websiteUrl", "Website or preview URL", "text", { required: true }),
      field("contentApproved", "Content approved", "checkbox"), field("designApproved", "Design approved", "checkbox"),
      field("functionalityApproved", "Forms and functionality approved", "checkbox"), field("mobileApproved", "Mobile experience approved", "checkbox"),
      field("seoApproved", "SEO titles and descriptions approved", "checkbox"), field("legalApproved", "Legal content approved by client", "checkbox"),
      field("launchDate", "Authorized launch date", "date", { required: true }), field("domainAuthorization", "Authorize required DNS/domain changes", "checkbox", { required: true }),
      field("finalNotes", "Final notes or exceptions", "textarea"),
    ],
  },
  {
    slug: "pixel-hutch-sop", name: "Pixel Hutch SOP", category: "Internal",
    description: "Standardize recurring internal processes with ownership, prerequisites, steps, quality checks, and revision history.",
    customerFacing: false,
    fields: [
      field("purpose", "Purpose", "textarea", { required: true }), field("scope", "Scope", "textarea"),
      field("owner", "Process owner"), field("frequency", "Frequency or trigger"),
      field("prerequisites", "Tools, access, and prerequisites", "textarea"), field("procedure", "Step-by-step procedure", "textarea", { required: true }),
      field("qualityChecks", "Quality and completion checks", "textarea"), field("exceptions", "Exceptions and escalation path", "textarea"),
      field("records", "Records or evidence retained", "textarea"), field("revisionNotes", "Revision notes", "textarea"),
    ],
  },
];
