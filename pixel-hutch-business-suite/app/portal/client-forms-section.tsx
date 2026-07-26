"use client";

import { useState } from "react";
import type { FormField } from "@/app/form-templates";

type ClientForm = { id:number; templateId:number; title:string; status:string; valuesJson:string; revision:number; dueDate:string|null; customerCanEdit:boolean; signatureName:string|null; signedAt:string|null; updatedAt:string };
type Template = { id:number; name:string; description:string; category:string; schemaJson:string; requiresSignature:boolean };

export default function ClientFormsSection({ leadId, forms, templates, onUpdated }:{ leadId:number; forms:ClientForm[]; templates:Template[]; onUpdated:()=>Promise<void> }) {
  const [openId,setOpenId]=useState<number|null>(forms.find(item=>["sent","in_progress"].includes(item.status))?.id||null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  if(!forms.length) return null;

  async function submit(event:React.FormEvent<HTMLFormElement>,form:ClientForm,template:Template,fields:FormField[]) {
    event.preventDefault(); setBusy(true); setMessage("Submitting…");
    const data=new FormData(event.currentTarget); const values:Record<string,string|boolean>={};
    for(const formField of fields) values[formField.id]=formField.type==="checkbox"?data.get(formField.id)==="on":String(data.get(formField.id)||"");
    const response=await fetch("/api/client-portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadId,action:"submitForm",formId:form.id,values,signatureName:data.get("signatureName")})});
    const payload=await response.json(); setBusy(false);
    setMessage(response.ok?"Thank you—your form was submitted to Pixel Hutch.":(payload.error||"Unable to submit the form."));
    if(response.ok){setOpenId(null);await onUpdated();}
  }

  return <section className="client-forms-section">
    <header><div><p className="crm-eyebrow">FORMS &amp; APPROVALS</p><h2>Project documents</h2><p>Complete requested information, review agreements, and keep signed approvals with your project.</p></div><span>{forms.filter(item=>["sent","in_progress"].includes(item.status)).length} need attention</span></header>
    {message&&<p className="client-form-message" role="status">{message}</p>}
    <div className="client-forms-list">{forms.map(form=>{
      const template=templates.find(item=>item.id===form.templateId); if(!template)return null;
      let fields:FormField[]=[];let values:Record<string,string|boolean>={};
      try{fields=JSON.parse(template.schemaJson);values=JSON.parse(form.valuesJson);}catch{}
      const done=["completed","signed","approved"].includes(form.status);
      return <article key={form.id} className={openId===form.id?"open":""}>
        <button className="client-form-summary" onClick={()=>setOpenId(current=>current===form.id?null:form.id)}><i>{done?"✓":"▤"}</i><span><b>{form.title}</b><small>{template.category} · revision {form.revision}{form.dueDate?` · due ${form.dueDate}`:""}</small></span><em className={done?"done":""}>{form.status}</em><strong>{openId===form.id?"−":"+"}</strong></button>
        {openId===form.id&&<form className="client-form-body" onSubmit={event=>submit(event,form,template,fields)}>
          <p>{template.description}</p>
          <div>{fields.map(formField=><label key={formField.id} className={formField.type==="textarea"?"wide":formField.type==="checkbox"?"check":""}>{formField.type==="checkbox"?<><input name={formField.id} type="checkbox" defaultChecked={Boolean(values[formField.id])} disabled={!form.customerCanEdit||done}/><span>{formField.label}{formField.required&&<em>Required</em>}</span></>:<><span>{formField.label}{formField.required&&<em>Required</em>}</span>{formField.type==="textarea"?<textarea name={formField.id} rows={4} defaultValue={String(values[formField.id]||"")} required={formField.required} disabled={!form.customerCanEdit||done}/>:formField.type==="select"?<select name={formField.id} defaultValue={String(values[formField.id]||"")} required={formField.required} disabled={!form.customerCanEdit||done}><option value="">Choose…</option>{formField.options?.map(option=><option key={option}>{option}</option>)}</select>:<input name={formField.id} type={formField.type} defaultValue={String(values[formField.id]||"")} required={formField.required} disabled={!form.customerCanEdit||done}/>}</>}</label>)}</div>
          {template.requiresSignature&&!done&&<section className="client-signature-box"><p>By typing your full legal name and submitting, you confirm that you reviewed this document and intend this entry to serve as your electronic signature.</p><label>Full legal name<input name="signatureName" required autoComplete="name"/></label></section>}
          {done&&form.signedAt&&<div className="client-signed-record"><span>✓</span><div><b>Signed by {form.signatureName}</b><small>{new Date(form.signedAt).toLocaleString()}</small></div></div>}
          {!done&&form.customerCanEdit&&<button className="crm-primary-button" disabled={busy}>{template.requiresSignature?"Sign & submit":"Submit completed form"}</button>}
          {!form.customerCanEdit&&!done&&<small>This document is currently available for review only.</small>}
        </form>}
      </article>;
    })}</div>
  </section>;
}
