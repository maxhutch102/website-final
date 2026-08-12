import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Live Business Software Demos",
  description: "Explore Pixel Hutch CRM, online booking, salon management, and restaurant operations demos in one place.",
  alternates: { canonical: "/demos" },
};

const demos = [
  { number: "01", eyebrow: "CRM + CLIENT PORTAL", title: "Business Hutch", description: "Click through a working business dashboard for customers, projects, tasks, billing, reporting, and client communication.", tags: ["Customer management", "Projects", "Billing", "Client portal"], actions: [{ label: "Open CRM demo", href: "/crm-demo" }] },
  { number: "02", eyebrow: "BOOKING + SALON OPERATIONS", title: "Juniper Studio", description: "Test the customer booking flow, then explore the business center used to manage appointments, staff, services, and clients.", tags: ["Online booking", "Staff calendars", "Client records", "Owner tools"], actions: [{ label: "Book an appointment", href: "https://salon-demo.pixel-hutch.com/booking" }, { label: "Open business center", href: "https://salon-demo.pixel-hutch.com/dashboard" }] },
  { number: "03", eyebrow: "RESTAURANT WEBSITE + OPERATIONS", title: "Copper & Sage", description: "Explore a restaurant website connected to live reservations, menu management, availability controls, and a secure owner dashboard.", tags: ["Reservations", "Live menu", "Table management", "Restaurant admin"], actions: [{ label: "Visit restaurant demo", href: "https://copper-sage-restaurant.mhutchi2517.workers.dev" }, { label: "View public menu", href: "https://copper-sage-restaurant.mhutchi2517.workers.dev/menu.html" }] },
];

export default function DemosPage() {
  return <main>
    <SiteHeader active="demos" />
    <section className="demos-hero section-shell" id="top">
      <p className="eyebrow"><span /> Real flows. Safe sample data.</p>
      <div><h1>TRY WHAT<br />WE <em>BUILD.</em></h1><p>These are working product demos—not screenshots. Explore the customer experience and the tools that keep each business organized behind the scenes.</p></div>
    </section>
    <section className="demos-grid section-shell" aria-label="Pixel Hutch demos">
      {demos.map((demo) => <article className="demo-card" key={demo.title}>
        <div className="demo-card-top"><span>{demo.number}</span><p>{demo.eyebrow}</p></div>
        <h2>{demo.title}</h2><p>{demo.description}</p>
        <div className="demo-tags">{demo.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="demo-card-actions">{demo.actions.map((action, index) => <a className={index === 0 ? "button" : "text-link"} href={action.href} key={action.label} target={action.href.startsWith("http") ? "_blank" : undefined} rel={action.href.startsWith("http") ? "noreferrer" : undefined}>{action.label} <span aria-hidden="true">↗</span></a>)}</div>
      </article>)}
    </section>
    <section className="services-cta section-shell"><div><p className="kicker kicker-light">NEED A DIFFERENT WORKFLOW?</p><h2>We&apos;ll shape the system<br />around your business.</h2></div><a className="button button-dark" href="/contact">Start a conversation <span aria-hidden="true">↗</span></a></section>
    <SiteFooter />
  </main>;
}
