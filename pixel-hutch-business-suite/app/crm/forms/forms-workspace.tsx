"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormField } from "@/app/form-templates";

type Template = { id:number; name:string; description:string; category:string; schemaJson:string; customerFacing:boolean; requiresSignature:boolean };
type Customer = { id:number; name:string; business:string; email:string; project:string };
type ClientForm = { id:number; templateId:number; leadId:number; title:string; status:string; valuesJson:string; revision:number; dueDate:string|null; customerCanEdit:boolean; customerVisible:boolean; signatureName:string|null; signedAt:string|null; approvedAt:string|null; updatedAt:string; lastNotifiedAt:string|null };
type Account = { id:number; leadId:number; status:string; invitedAt:string|null; firstLoginAt:string|null };

function valuesOf(form: ClientForm | null) {
  try { return form ? JSON.parse(form.valuesJson) as Record<string,string|boolean> : {}; } catch { return {}; }
}

export default function FormsWorkspace() {
  const [templates,setTemplates] = useState<Template[]>([]);
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [forms,setForms] = useState<ClientForm[]>([]);
  const [accounts,setAccounts] = useState<Account[]>([]);
  const [selectedId,setSelectedId] = useState<number|null>(null);
  const [showCreate,setShowCreate] = useState(false);
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [filter,setFilter] = useState("active");
  const [customerFilter,setCustomerFilter] = useState<number|null>(null);
  const selected = forms.find(form=>form.id===selectedId) || null;
  const template = templates.find(item=>item.id===selected?.templateId) || null;
  const customer = customers.find(item=>item.id===selected?.leadId) || null;
  const fields:FormField[] = useMemo(()=>{ try { return template ? JSON.parse(template.schemaJson) : []; } catch { return []; } },[template]);

  async function load() {
    const [formsResponse,accountsResponse] = await Promise.all([fetch("/api/forms"),fetch("/api/client-accounts")]);
    const data = await formsResponse.json();
    if (!formsResponse.ok) return setMessage(data.error || "Unable to load forms.");
    const linkedCustomer = Number(new URLSearchParams(window.location.search).get("customer")) || null;
    setTemplates(data.templates); setCustomers(data.customers); setForms(data.forms); setCustomerFilter(linkedCustomer);
    const firstForm = linkedCustomer ? data.forms.find((item:ClientForm)=>item.leadId===linkedCustomer) : data.forms[0];
    if (!selectedId && firstForm) setSelectedId(firstForm.id);
    if (accountsResponse.ok) setAccounts((await accountsResponse.json()).accounts);
  }
  useEffect(()=>{ void load(); },[]);

  async function createForm(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/forms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form.entries()))});
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error || "Unable to create the form.");
    setForms(current=>[data.form,...current]); setSelectedId(data.form.id); setShowCreate(false); setMessage("Draft created.");
  }

  async function saveForm(source:React.FormEvent<HTMLFormElement>|HTMLFormElement,action:string) {
    if ("preventDefault" in source) source.preventDefault();
    const formElement = "currentTarget" in source ? source.currentTarget : source;
    if(!selected) return;
    setBusy(true); setMessage(action==="send" ? "Sending to customer…" : "Saving…");
    const formData = new FormData(formElement);
    const values:Record<string,string|boolean> = {};
    for(const field of fields) values[field.id] = field.type==="checkbox" ? formData.get(field.id)==="on" : String(formData.get(field.id)||"");
    const response = await fetch("/api/forms",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      id:selected.id,action,title:formData.get("title"),dueDate:formData.get("dueDate"),
      customerCanEdit:formData.get("customerCanEdit")==="on",message:formData.get("emailMessage"),values,
    })});
    const data = await response.json(); setBusy(false);
    if(!response.ok) return setMessage(data.error || "Unable to save the form.");
    setForms(current=>current.map(item=>item.id===data.form.id?data.form:item));
    setMessage(data.warning || (action==="send" ? `Sent to ${customer?.email}.` : action==="saveAndNotify" ? "Saved and customer notified." : "Draft saved without emailing the customer."));
  }

  async function inviteClient() {
    if(!customer) return; setBusy(true); setMessage("Creating client access…");
    const response=await fetch("/api/client-accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadId:customer.id})});
    const data=await response.json(); setBusy(false); setMessage(data.message || data.error || "Client account updated.");
    await load();
  }

  const visibleForms=forms.filter(form=>(!customerFilter||form.leadId===customerFilter)&&(filter==="all" ? true : filter==="active" ? form.status!=="archived" : form.status===filter));
  const currentValues=valuesOf(selected);
  const account=accounts.find(item=>item.leadId===customer?.id);
  const filteredCustomer=customers.find(item=>item.id===customerFilter);

  return <section className="forms-workspace">
    <header className="forms-heading"><div><p>CLIENT OPERATIONS</p><h1>{filteredCustomer?`${filteredCustomer.business} forms`:"Forms & approvals"}</h1><span>{filteredCustomer?<>Showing forms linked to this customer. <a href={`/crm/customers?lead=${filteredCustomer.id}`}>Return to customer record →</a></>:"Create, send, complete, approve, and retain every customer document in one place."}</span></div><button onClick={()=>setShowCreate(current=>!current)}>{showCreate?"Cancel":"+ New form"}</button></header>
    {showCreate&&<form className="forms-create" onSubmit={createForm}>
      <label>Template<select name="templateId" required defaultValue=""><option value="">Choose a template…</option>{templates.map(item=><option key={item.id} value={item.id}>{item.category} — {item.name}</option>)}</select></label>
      <label>Customer<select name="leadId" required defaultValue={customerFilter?String(customerFilter):""}><option value="">Choose a customer…</option>{customers.map(item=><option key={item.id} value={item.id}>{item.business} — {item.name}</option>)}</select></label>
      <label>Custom title<input name="title" placeholder="Optional—uses template name by default" /></label>
      <label>Due date<input name="dueDate" type="date" /></label>
      <button disabled={busy}>Create draft</button>
    </form>}
    {message&&<p className="forms-message" role="status">{message}</p>}
    <div className="forms-layout">
      <aside className="forms-list">
        <div><label>Show<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="active">Active</option><option value="draft">Drafts</option><option value="sent">Awaiting customer</option><option value="completed">Completed</option><option value="approved">Approved</option><option value="all">All</option></select></label><span>{visibleForms.length} records{customerFilter&&<> · <button type="button" onClick={()=>{setCustomerFilter(null);window.history.replaceState(null,"","/crm/forms");}}>Show all</button></>}</span></div>
        {visibleForms.map(form=>{const itemTemplate=templates.find(item=>item.id===form.templateId);const itemCustomer=customers.find(item=>item.id===form.leadId);return <button key={form.id} className={form.id===selectedId?"active":""} onClick={()=>setSelectedId(form.id)}><i>{itemTemplate?.category.slice(0,1)||"F"}</i><span><b>{form.title}</b><small>{itemCustomer?.business} · rev {form.revision}</small></span><em>{form.status}</em></button>})}
        {!visibleForms.length&&<div className="forms-empty">No forms match this view.</div>}
      </aside>
      <section className="forms-editor">
        {selected&&template&&customer?<form key={`${selected.id}-${selected.revision}-${selected.updatedAt}`} onSubmit={event=>saveForm(event,"save")}>
          <header><div><p>{template.category.toUpperCase()}</p><input name="title" defaultValue={selected.title} aria-label="Form title" /></div><span className={`form-status ${selected.status}`}>{selected.status.replaceAll("_"," ")}</span></header>
          <div className="forms-client-strip"><div><span>CUSTOMER</span><b>{customer.business}</b><small>{customer.name} · {customer.email}</small><a href={`/crm/customers?lead=${customer.id}`}>Open customer record →</a></div><div><span>CLIENT ACCOUNT</span><b>{account?.status==="active"?"Active":account?"Invited":"Not created"}</b><small>{account?.firstLoginAt?`First login ${new Date(account.firstLoginAt).toLocaleDateString()}`:account?.invitedAt?`Invited ${new Date(account.invitedAt).toLocaleDateString()}`:"Portal invitation has not been sent"}</small></div><button type="button" onClick={inviteClient} disabled={busy}>{account?"Resend access":"Create client account"}</button></div>
          <p className="forms-description">{template.description}</p>
          <div className="forms-fields">{fields.map(field=><label key={field.id} className={field.type==="textarea"?"wide":field.type==="checkbox"?"check":""}>{field.type==="checkbox"?<><input name={field.id} type="checkbox" defaultChecked={Boolean(currentValues[field.id])} required={field.required}/><span>{field.label}{field.required&&<em>Required</em>}</span></>:<><span>{field.label}{field.required&&<em>Required</em>}</span>{field.type==="textarea"?<textarea name={field.id} rows={4} required={field.required} defaultValue={String(currentValues[field.id]||"")} placeholder={field.placeholder}/>:field.type==="select"?<select name={field.id} required={field.required} defaultValue={String(currentValues[field.id]||"")}><option value="">Choose…</option>{field.options?.map(option=><option key={option}>{option}</option>)}</select>:<input name={field.id} type={field.type} required={field.required} defaultValue={String(currentValues[field.id]||"")} placeholder={field.placeholder}/>}</>}</label>)}</div>
          <section className="forms-delivery"><label>Customer due date<input name="dueDate" type="date" defaultValue={selected.dueDate||""}/></label><label className="check"><input name="customerCanEdit" type="checkbox" defaultChecked={selected.customerCanEdit}/><span>Allow customer to edit and submit</span></label><label className="wide">Optional email note<textarea name="emailMessage" rows={2} placeholder="Add context for this update…"/></label></section>
          {selected.signedAt&&<div className="forms-signature"><span>✓</span><div><b>Signed by {selected.signatureName}</b><small>{new Date(selected.signedAt).toLocaleString()}</small></div></div>}
          <footer><button type="submit" disabled={busy}>Save draft</button>{selected.customerVisible&&<button type="button" disabled={busy} onClick={event=>saveForm(event.currentTarget.form!,"saveAndNotify")}>Save & notify customer</button>}<button className="primary" type="button" disabled={busy} onClick={event=>saveForm(event.currentTarget.form!,"send")}>{selected.customerVisible?"Resend to customer":"Send to customer"}</button><button type="button" onClick={()=>window.print()}>Print / PDF</button></footer>
        </form>:<div className="forms-empty editor"><h2>Choose a form</h2><p>Select a record or create one from a Pixel Hutch template.</p></div>}
      </section>
    </div>
  </section>;
}
