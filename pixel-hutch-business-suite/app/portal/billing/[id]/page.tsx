import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { billingDocuments, employees, leads, payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ClientDocumentPrint from "./print-button";

export const dynamic = "force-dynamic";

type LineItem = { description: string; quantity: number; rateCents: number };

export default async function ClientBillingDocument({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const leadId = Number(query.project);
  const user = await requireChatGPTUser(leadId ? `/portal/billing/${id}?project=${leadId}` : `/portal/billing/${id}`);
  const db = await getDb();
  const [record] = await db.select().from(billingDocuments).where(eq(billingDocuments.id, Number(id))).limit(1);
  if (!record || !record.leadId || record.leadId !== leadId) return <main className="client-document-error"><h1>Document not found</h1><p>This document is not connected to that client portal.</p></main>;
  const [customer] = await db.select().from(leads).where(eq(leads.id, record.leadId)).limit(1);
  const [employee] = await db.select().from(employees).where(eq(employees.email, user.email.toLowerCase())).limit(1);
  const isOwner = user.email.toLowerCase() === "mhutchi2517@gmail.com";
  if (!customer || (!employee && !isOwner && customer.email.toLowerCase() !== user.email.toLowerCase())) {
    return <main className="client-document-error"><h1>Access denied</h1><p>This document is not connected to your account.</p></main>;
  }
  const history = await db.select().from(payments).where(eq(payments.billingDocumentId, record.id)).orderBy(desc(payments.paidAt));
  const items = JSON.parse(record.lineItemsJson || "[]") as LineItem[];
  const balance = Math.max(0, record.totalCents - record.paidCents);
  const documentLabel = record.kind === "invoice" && record.status === "paid" ? "RECEIPT" : record.kind.toUpperCase();
  return <main className="client-document-page">
    <div className="client-document-toolbar"><a href={`/portal?project=${record.leadId}`}>← Back to client portal</a><ClientDocumentPrint /></div>
    <section className="client-billing-document">
      <header><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><div><span>{documentLabel}</span><h1>{record.number}</h1><p>{record.status === "paid" ? "Paid in full" : record.status}</p></div></header>
      <div className="client-document-parties"><div><span>BILL TO</span><b>{record.customerBusiness || record.customerName}</b><p>{record.customerName}<br />{record.customerEmail}</p></div><div><span>ISSUED</span><b>{record.issueDate}</b>{record.dueDate && <><span>DUE</span><b>{record.dueDate}</b></>}</div></div>
      <div className="client-document-lines"><header><span>DESCRIPTION</span><span>QTY</span><span>RATE</span><span>AMOUNT</span></header>{items.map((item,index) => <div key={`${item.description}-${index}`}><span>{item.description}</span><span>{item.quantity}</span><span>${(item.rateCents/100).toFixed(2)}</span><b>${((item.quantity*item.rateCents)/100).toFixed(2)}</b></div>)}</div>
      <div className="client-document-totals"><span>Subtotal <b>${(record.subtotalCents/100).toFixed(2)}</b></span>{record.discountCents > 0 && <span>Discount <b>−${(record.discountCents/100).toFixed(2)}</b></span>}<span>Tax <b>${(record.taxCents/100).toFixed(2)}</b></span><strong>Total <b>${(record.totalCents/100).toFixed(2)}</b></strong><span>Paid <b>${(record.paidCents/100).toFixed(2)}</b></span><strong className="balance">Balance due <b>${(balance/100).toFixed(2)}</b></strong></div>
      {record.notes && <div className="client-document-notes"><span>NOTES</span><p>{record.notes}</p></div>}
      {!!history.length && <div className="client-document-payments"><h2>Payment history</h2>{history.map(payment => <div key={payment.id}><span>{new Date(payment.paidAt).toLocaleDateString()}</span><span>{payment.method.toUpperCase()}</span><span>{payment.reference || "—"}</span><b>${(payment.amountCents/100).toFixed(2)}</b></div>)}</div>}
    </section>
  </main>;
}
