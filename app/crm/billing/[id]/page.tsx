import { getDb } from "@/db";
import { billingDocuments, leads } from "@/db/schema";
import { isAccessResponse, requireAccess } from "@/db/access";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import DocumentActions from "./document-actions";

export const dynamic = "force-dynamic";

type LineItem = { description: string; quantity: number; rateCents: number };

const money = (cents: number) => (cents / 100).toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAccess(["owner", "admin", "sales"]);
  if (isAccessResponse(actor)) redirect("/login");

  const { id } = await params;
  const db = await getDb();
  const record = (await db.select().from(billingDocuments).where(eq(billingDocuments.id, Number(id))).limit(1))[0];
  if (!record) notFound();
  const relatedLead = record.leadId
    ? (await db.select().from(leads).where(eq(leads.id, record.leadId)).limit(1))[0]
    : null;

  let lineItems: LineItem[] = [];
  try { lineItems = JSON.parse(record.lineItemsJson) as LineItem[]; } catch { lineItems = []; }
  const customer = record.customerBusiness || record.customerName;
  const balance = Math.max(0, record.totalCents - record.paidCents);

  return (
    <main className="document-viewer">
      <DocumentActions number={record.number} customer={customer} lineItems={lineItems} />
      {relatedLead && <nav className="document-related-records" aria-label="Related records"><a href={`/crm?view=customers&lead=${relatedLead.id}`}>Customer: {relatedLead.business} ↗</a><a href={`/crm?view=projects&lead=${relatedLead.id}`}>Project: {relatedLead.project} ↗</a></nav>}
      <article className="print-document">
        <header className="print-document-head">
          <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" />
          <div>
            <span className={`document-status status-${record.status}`}>{record.status === "void" ? "Canceled" : record.status}</span>
            <h1>{record.kind === "invoice" && record.status === "paid" ? "Receipt" : record.kind === "invoice" ? "Invoice" : "Estimate"}</h1>
            <b>{record.number}</b>
          </div>
        </header>

        <section className="document-addresses">
          <div><span>FROM</span><b>Pixel Hutch</b><p>Arizona based business technology</p><p>max@pixel-hutch.com</p></div>
          <div><span>BILL TO</span><b>{customer}</b>{record.customerBusiness && <p>{record.customerName}</p>}<p>{record.customerEmail}</p></div>
          <div><span>DETAILS</span><p><b>Issued:</b> {record.issueDate}</p><p><b>Due:</b> {record.dueDate || "Upon receipt"}</p><p><b>Frequency:</b> {record.recurring ? record.recurrence : "One time"}</p></div>
        </section>

        <table className="document-items">
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>{lineItems.map((item, index) => <tr key={`${item.description}-${index}`}><td>{item.description}</td><td>{item.quantity}</td><td>{money(item.rateCents)}</td><td>{money(item.quantity * item.rateCents)}</td></tr>)}</tbody>
        </table>

        <section className="document-bottom">
          <div>{record.notes && <><span>NOTES</span><p>{record.notes}</p></>}</div>
          <dl>
            <div><dt>Subtotal</dt><dd>{money(record.subtotalCents)}</dd></div>
            {record.discountCents > 0 && <div><dt>Discount</dt><dd>−{money(record.discountCents)}</dd></div>}
            {record.taxCents > 0 && <div><dt>Tax</dt><dd>{money(record.taxCents)}</dd></div>}
            <div className="document-total"><dt>Total</dt><dd>{money(record.totalCents)}</dd></div>
            {record.paidCents > 0 && <div><dt>Paid</dt><dd>−{money(record.paidCents)}</dd></div>}
            <div className="document-balance"><dt>Balance</dt><dd>{money(balance)}</dd></div>
          </dl>
        </section>
        <footer><p>Thank you for choosing Pixel Hutch.</p><span>Websites, business systems, and tech support without the runaround.</span></footer>
      </article>
    </main>
  );
}
