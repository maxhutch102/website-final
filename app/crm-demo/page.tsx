"use client";

import { useState } from "react";

const views = ["Dashboard", "Leads", "Customers", "Projects", "Invoices", "Client portal"];
const leads = [["Desert Bloom Landscaping","Website + CRM","Qualified","$6,800"],["Copper State Electric","Service portal","Proposal","$9,400"],["Northstar Wellness","Booking system","New","$4,200"]];
const customers = [["Mesa Modern Homes","Avery Reed","2 active projects","$12,500"],["Canyon Coffee Co.","Jordan Lee","Website care","$2,388"],["Summit Air & Heat","Morgan Diaz","CRM rollout","$8,750"]];

export default function CrmDemoPage() {
  const [view, setView] = useState("Dashboard");
  const [toast, setToast] = useState("");
  const action = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  return (
    <main className="crm-demo-shell">
      {toast && <div className="crm-demo-toast">{toast}</div>}
      <aside className="crm-demo-sidebar">
        <a href="/" className="crm-demo-brand"><span>PH</span><b>BUSINESS<br/>HUTCH</b><small>INTERACTIVE DEMO</small></a>
        <nav>{views.map(item => <button className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}><i>{["⌂","◇","◎","▦","$","↗"][views.indexOf(item)]}</i>{item}</button>)}</nav>
        <div><small>FICTIONAL WORKSPACE</small><b>Brightline Services</b><a href="/booking-systems">View booking demo →</a><a href="/">Back to Pixel Hutch →</a></div>
      </aside>
      <section className="crm-demo-main">
        <header><div><small>PIXEL HUTCH PRODUCT DEMO</small><b>{view}</b></div><div><button onClick={() => action("Demo notification marked read")}>● 3</button><span>MR</span><p><b>Morgan Reed</b><small>Administrator</small></p></div></header>
        <div className="crm-demo-content">
          <div className="crm-demo-heading"><div><p>BRIGHTLINE SERVICES</p><h1>{view}</h1><span>Explore a sample business workspace with fictional data.</span></div><button onClick={() => action(`Sample ${view === "Dashboard" ? "record" : view.slice(0,-1).toLowerCase()} created`)}>+ Add new</button></div>
          {view === "Dashboard" && <><div className="crm-demo-kpis"><article><span>OPEN PIPELINE</span><b>$20,400</b><small>3 active opportunities</small></article><article><span>ACTIVE PROJECTS</span><b>6</b><small>2 due this week</small></article><article><span>OUTSTANDING</span><b>$7,850</b><small>Across 4 invoices</small></article><article><span>MONTHLY REVENUE</span><b>$18,260</b><small>↑ 14% from June</small></article></div><div className="crm-demo-grid"><article className="crm-demo-panel"><header><div><small>SALES</small><h2>Lead pipeline</h2></div><button onClick={()=>setView("Leads")}>View all →</button></header>{leads.map(row=><div className="crm-demo-row" key={row[0]}><i/><span><b>{row[0]}</b><small>{row[1]}</small></span><em>{row[2]}</em><strong>{row[3]}</strong></div>)}</article><article className="crm-demo-panel"><header><div><small>NEXT UP</small><h2>Today&apos;s work</h2></div></header>{[["10:00 AM","Discovery call","Northstar Wellness"],["1:30 PM","Homepage review","Mesa Modern Homes"],["3:00 PM","Send proposal","Copper State Electric"]].map(row=><div className="crm-demo-task" key={row[1]}><b>{row[0]}</b><span>{row[1]}<small>{row[2]}</small></span><button onClick={()=>action("Task marked complete")}>✓</button></div>)}</article></div></>}
          {(view === "Leads" || view === "Customers") && <article className="crm-demo-table"><header><span>{view === "Leads" ? "COMPANY" : "CUSTOMER"}</span><span>{view === "Leads" ? "NEED" : "CONTACT"}</span><span>STATUS</span><span>VALUE</span><span></span></header>{(view === "Leads" ? leads : customers).map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span><em>{row[2]}</em><strong>{row[3]}</strong><button onClick={()=>action(`${row[0]} opened`)}>Open →</button></div>)}</article>}
          {view === "Projects" && <div className="crm-demo-board">{[["PLANNING",[["Northstar booking","Discovery complete"],["Summit CRM","Requirements"]]],["IN PROGRESS",[["Mesa Modern website","72% complete"],["Canyon Coffee care","Monthly updates"]]],["CLIENT REVIEW",[["Copper State portal","Awaiting feedback"]]],["COMPLETE",[["Brightline brand","Delivered July 18"]]]].map(([stage,items])=><section key={stage as string}><header>{stage}<span>{(items as string[][]).length}</span></header>{(items as string[][]).map(([title,note])=><article key={title}><small>PROJECT</small><b>{title}</b><p>{note}</p><div><i/><i/><i/></div></article>)}</section>)}</div>}
          {view === "Invoices" && <article className="crm-demo-table"><header><span>INVOICE</span><span>CUSTOMER</span><span>STATUS</span><span>AMOUNT</span><span></span></header>{[["INV-1048","Mesa Modern Homes","Due Jul 30","$4,250"],["INV-1047","Summit Air & Heat","Paid","$3,500"],["INV-1046","Canyon Coffee Co.","Recurring","$199"]].map(row=><div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span><em>{row[2]}</em><strong>{row[3]}</strong><button onClick={()=>action(`${row[0]} preview opened`)}>Preview →</button></div>)}</article>}
          {view === "Client portal" && <div className="crm-demo-client"><aside><b>MM</b><h2>Mesa Modern Homes</h2><span>CLIENT PORTAL PREVIEW</span><nav><i>Overview</i><i>Project</i><i>Messages</i><i>Files</i><i>Billing</i></nav></aside><section><p>WELCOME BACK, AVERY</p><h2>Your website project</h2><div className="crm-demo-progress"><span><i/></span><b>72% complete</b></div><div><article><small>NEXT MILESTONE</small><b>Homepage approval</b><p>Review the latest design and leave feedback.</p><button onClick={()=>action("Client review opened")}>Review design</button></article><article><small>LATEST UPDATE</small><b>Mobile layouts are ready</b><p>Posted today by Morgan</p><button onClick={()=>action("Message thread opened")}>Open messages</button></article></div></section></div>}
        </div>
      </section>
    </main>
  );
}
