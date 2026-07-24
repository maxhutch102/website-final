"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PortalData = {
  viewer: { name:string; email:string; role:string; isStaff:boolean; testClient?:boolean };
  customer: { id:number; name:string; business:string; email:string; project:string };
  project: { id:number; status:string; progress:number; currentPhase:string; nextStep:string; targetDate:string|null; clientSummary:string };
  updates: { id:number; title:string; message:string; createdAt:string }[];
  requests: { id:number; title:string; description:string; category:string; required:boolean; status:string; dueDate:string|null }[];
  files: { id:number; requestId:number|null; filename:string; sizeBytes:number; caption:string; uploadedByName:string; createdAt:string }[];
  billing: { id:number; number:string; kind:string; status:string; issueDate:string; dueDate:string|null; totalCents:number; paidCents:number }[];
  payments: { id:number; billingDocumentId:number; amountCents:number; method:string; reference:string; paidAt:string }[];
  messages: { id:number; senderName:string; senderType:string; message:string; createdAt:string }[];
  tasks: { id:number; title:string; description:string; milestone:string; status:string; dueDate:string|null; clientApprovalRequired:boolean }[];
};

export default function ClientPortal({ initialLeadId }: { initialLeadId:number|null }) {
  const leadId = initialLeadId;
  const [data, setData] = useState<PortalData|null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadRequestId, setUploadRequestId] = useState<number|null>(null);

  async function load(id:number) {
    setError("");
    const response = await fetch(`/api/client-portal?leadId=${id}`);
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || "Unable to open this project."); return; }
    setData(payload);
  }
  useEffect(() => {
    if (!leadId) return;
    fetch(`/api/client-portal?leadId=${leadId}`).then(async response => {
      const payload = await response.json();
      if (!response.ok) setError(payload.error || "Unable to open this project.");
      else setData(payload);
    });
  }, [leadId]);

  async function upload(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadId) return;
    setMessage("Uploading…");
    const form = new FormData(event.currentTarget);
    form.set("leadId", String(leadId));
    if (uploadRequestId) form.set("requestId", String(uploadRequestId));
    const response = await fetch("/api/client-portal", { method:"POST", body:form });
    const payload = await response.json();
    setMessage(response.ok ? "Your file was uploaded and the Pixel Hutch team has been notified." : (payload.error || "Upload failed."));
    if (response.ok) { event.currentTarget.reset(); setUploadRequestId(null); await load(leadId); }
  }

  async function sendChatMessage(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const outgoingMessage = String(form.get("message") || "").trim();
    if (!outgoingMessage) return;
    setMessage("Sending…");
    const response = await fetch("/api/client-portal", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ leadId, action:"sendMessage", message:outgoingMessage }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Message sent." : (payload.error || "Unable to send your message."));
    if (response.ok) {
      formElement.reset();
      if (payload.message) {
        setData(current => current ? {...current, messages:current.messages.some(item=>item.id===payload.message.id) ? current.messages : [...current.messages, payload.message]} : current);
      } else {
        await load(leadId);
      }
    }
  }

  if (!leadId) return <main className="client-portal-shell"><section className="client-portal-empty"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><p className="crm-eyebrow">CLIENT PORTAL</p><h1>Your project link is required.</h1><p>Open the secure portal link from your Pixel Hutch welcome email. Each link connects to one customer project.</p><Link href="/">Return to Pixel Hutch</Link></section></main>;
  if (error) return <main className="client-portal-shell"><section className="client-portal-empty"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><h1>We couldn&apos;t open that project.</h1><p>{error}</p><Link href="/">Return to Pixel Hutch</Link></section></main>;
  if (!data) return <main className="client-portal-shell"><section className="client-portal-empty"><p>Loading your project…</p></section></main>;

  const pending = data.requests.filter(item => item.status === "requested");
  const activeInvoices = data.billing.filter(item => item.kind === "invoice" && item.status !== "void");
  const amountBilled = activeInvoices.reduce((sum, item) => sum + item.totalCents, 0);
  const amountPaid = activeInvoices.reduce((sum, item) => sum + item.paidCents, 0);
  const amountDue = Math.max(0, amountBilled - amountPaid);
  return <main className="client-portal-shell">
    <header className="client-portal-header"><Link href="/"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /></Link><div><span>CLIENT PORTAL</span><b>{data.customer.business}</b></div><a href="/api/auth/logout?returnTo=/">Sign out</a></header>
    <section className="client-portal-content">
      {data.viewer.isStaff && <div className="staff-preview-banner"><b>Employee preview</b><span>You are viewing the exact portal experience connected to this customer.</span><Link href={`/crm?view=projects&lead=${data.customer.id}`}>Return to Business Hutch</Link></div>}
      {data.viewer.testClient && <div className="test-client-banner"><div><b>TEST CLIENT ACCOUNT</b><span>You are viewing this portal exactly as the customer sees it.</span></div><button onClick={async()=>{await fetch("/api/test-access",{method:"DELETE"});window.location.href="/crm?view=settings";}}>Return to Owner</button></div>}
      <div className="client-welcome"><div><p className="crm-eyebrow">{data.project.status.toUpperCase().replaceAll("_"," ")}</p><h1>{data.customer.project}</h1><p>Hi {data.customer.name.split(" ")[0]}—here&apos;s the latest on your project.</p></div><div className="client-progress-ring" style={{"--progress": `${data.project.progress * 3.6}deg`} as React.CSSProperties}><strong>{data.project.progress}%</strong><span>complete</span></div></div>
      <div className="client-progress-bar"><i style={{width:`${data.project.progress}%`}} /></div>
      <div className="client-summary-grid"><article><span>CURRENT PHASE</span><b>{data.project.currentPhase}</b></article><article><span>NEXT STEP</span><b>{data.project.nextStep}</b></article><article><span>TARGET DATE</span><b>{data.project.targetDate || "To be confirmed"}</b></article></div>
      <section className="client-status-card"><p className="crm-eyebrow">PROJECT SUMMARY</p><h2>Where things stand</h2><p>{data.project.clientSummary}</p></section>

      {data.tasks.length > 0 && <section className="client-work-plan"><header><div><p className="crm-eyebrow">PROJECT ROADMAP</p><h2>Milestones & progress</h2><p>See the parts of the work your Pixel Hutch team has shared with you.</p></div><span>{data.tasks.filter(task => task.status === "done").length}/{data.tasks.length} complete</span></header><div>{Array.from(new Set(data.tasks.map(task => task.milestone))).map(milestone => <section key={milestone}><h3>{milestone}</h3>{data.tasks.filter(task => task.milestone === milestone).map(task => <article key={task.id} className={task.status === "done" ? "complete" : ""}><i>{task.status === "done" ? "✓" : task.status === "in_progress" ? "→" : ""}</i><div><b>{task.title}</b><small>{task.description}{task.dueDate ? ` · Target ${task.dueDate}` : ""}</small></div><em>{task.clientApprovalRequired && task.status !== "done" ? "Approval needed" : task.status.replaceAll("_"," ")}</em></article>)}</section>)}</div></section>}

      <section className="client-billing-section">
        <header><div><p className="crm-eyebrow">BILLING &amp; PAYMENTS</p><h2>Your account</h2><p>Review what has been billed, what you have paid, and any remaining balance.</p></div><span>{activeInvoices.length} invoice{activeInvoices.length === 1 ? "" : "s"}</span></header>
        <div className="client-billing-summary"><article><span>AMOUNT DUE</span><strong>${(amountDue / 100).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><small>{amountDue ? "Across open invoices" : "Your account is current"}</small></article><article><span>TOTAL PAID</span><strong>${(amountPaid / 100).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><small>Recorded payments</small></article><article><span>TOTAL BILLED</span><strong>${(amountBilled / 100).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><small>Active invoices</small></article></div>
        <div className="client-billing-grid">
          <div className="client-account-list"><h3>Estimates, invoices &amp; receipts</h3>{data.billing.length ? data.billing.map(document => { const balance = Math.max(0, document.totalCents - document.paidCents); const label = document.kind === "invoice" && document.status === "paid" ? "receipt" : document.kind; return <a key={document.id} href={`/portal/billing/${document.id}?project=${data.customer.id}`} target="_blank" rel="noreferrer"><div><b>{document.number}</b><small>{label} · issued {document.issueDate}{document.dueDate ? ` · due ${document.dueDate}` : ""}</small></div><div><strong>${(document.totalCents/100).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><em>{document.status === "void" ? "Canceled" : balance ? `$${(balance/100).toFixed(2)} due` : "Paid · receipt available"}</em></div><span>Open ↗</span></a>; }) : <div className="client-friendly-empty"><span>$</span><h3>No billing documents yet.</h3><p>Estimates, invoices, and receipts will appear here when they are ready.</p></div>}</div>
          <div className="client-payment-history"><h3>Payment history</h3>{data.payments.length ? data.payments.map(payment => { const document = data.billing.find(item => item.id === payment.billingDocumentId); return <article key={payment.id}><i>✓</i><div><b>${(payment.amountCents/100).toLocaleString(undefined,{minimumFractionDigits:2})}</b><small>{new Date(payment.paidAt).toLocaleDateString()} · {payment.method.toUpperCase()}{payment.reference ? ` · ${payment.reference}` : ""}</small></div><span>{document?.number || "Payment"}</span></article>; }) : <div className="client-friendly-empty"><span>◇</span><h3>No payments recorded yet.</h3><p>Your payment history will stay available here.</p></div>}</div>
        </div>
      </section>

      <section className="client-message-center">
        <header><div><p className="crm-eyebrow">QUESTIONS &amp; MESSAGES</p><h2>Chat with Pixel Hutch</h2><p>Ask a question or send a project detail. Your conversation stays connected to this project.</p></div><span>{data.messages.length} message{data.messages.length === 1 ? "" : "s"}</span></header>
        <div className="client-chat-thread">
          {data.messages.length ? data.messages.map(item => <article key={item.id} className={item.senderType === "client" ? "from-client" : "from-team"}><div><b>{item.senderType === "client" ? "You" : item.senderName}</b><time>{new Date(item.createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></div><p>{item.message}</p></article>) : <div className="client-friendly-empty"><span>✉</span><h3>No messages yet.</h3><p>Send the team a question whenever you need help.</p></div>}
        </div>
        <form className="client-chat-form" onSubmit={sendChatMessage}><textarea name="message" rows={3} maxLength={4000} required placeholder="Type your question or message…" /><button className="crm-primary-button">Send message</button></form>
        {message && <p className="client-chat-status" role="status">{message}</p>}
      </section>

      <div className="client-two-column">
        <section className="client-panel"><header><div><p className="crm-eyebrow">NEEDED FROM YOU</p><h2>Requested files & information</h2></div><span>{pending.length} open</span></header>
          {pending.length ? <div className="client-request-list">{pending.map(item => <article key={item.id}><i>{item.status === "received" ? "✓" : "↑"}</i><div><b>{item.title}{item.required && <em>Required</em>}</b><p>{item.description || `Please upload the requested ${item.category}.`}</p><small>{item.dueDate ? `Requested by ${item.dueDate}` : item.category}</small></div><button onClick={() => { setUploadRequestId(item.id); document.getElementById("client-upload")?.scrollIntoView({behavior:"smooth"}); }}>Upload file</button></article>)}</div> : <div className="client-friendly-empty"><span>✓</span><h3>You&apos;re all caught up.</h3><p>We don&apos;t need anything else from you right now.</p></div>}
        </section>
        <section className="client-panel" id="client-upload"><header><div><p className="crm-eyebrow">SECURE UPLOAD</p><h2>Send photos or documents</h2></div></header>
          <form className="client-upload-form" onSubmit={upload}><label className="client-dropzone"><input name="file" type="file" required accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" /><span>↑</span><b>Choose a file to upload</b><small>Photos, PDFs, Word, or spreadsheet files · 25 MB max</small></label><label>File type<select name="category"><option value="photo">Photo</option><option value="content">Website content</option><option value="brand">Brand or logo file</option><option value="contract">Contract or form</option><option value="other">Other</option></select></label><label>Note for the team<textarea name="caption" rows={3} placeholder="Tell us what this file is or where it belongs…" /></label>{uploadRequestId && <div className="upload-linked-request"><span>Uploading for:</span><b>{data.requests.find(item => item.id === uploadRequestId)?.title}</b><button type="button" onClick={() => setUploadRequestId(null)}>Clear</button></div>}<button className="crm-primary-button">Upload securely</button>{message && <p role="status">{message}</p>}</form>
        </section>
      </div>

      <div className="client-two-column">
        <section className="client-panel"><header><div><p className="crm-eyebrow">PROGRESS HISTORY</p><h2>Project updates</h2></div></header>{data.updates.length ? <div className="client-timeline">{data.updates.map(item => <article key={item.id}><i /><time>{new Date(item.createdAt).toLocaleDateString([], {month:"short",day:"numeric",year:"numeric"})}</time><b>{item.title}</b><p>{item.message}</p></article>)}</div> : <div className="client-friendly-empty"><span>◇</span><h3>Updates will appear here.</h3><p>Your team will post important milestones and review notes.</p></div>}</section>
        <section className="client-panel"><header><div><p className="crm-eyebrow">PROJECT FILES</p><h2>Shared documents</h2></div><span>{data.files.length}</span></header>{data.files.length ? <div className="client-file-list">{data.files.map(file => <a key={file.id} href={`/api/client-portal/files/${file.id}`} target="_blank" rel="noreferrer"><i>▤</i><span><b>{file.filename}</b><small>{(file.sizeBytes/1024).toFixed(0)} KB · uploaded {new Date(file.createdAt).toLocaleDateString()}</small></span><em>Open ↗</em></a>)}</div> : <div className="client-friendly-empty"><span>▤</span><h3>No shared files yet.</h3><p>Approvals, drafts, and uploaded documents will stay together here.</p></div>}
        </section>
      </div>
    </section>
  </main>;
}
