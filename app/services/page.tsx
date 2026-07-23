"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { ReactNode, useEffect, useRef, useState } from "react";

const offers = [
  {
    id: "websites",
    number: "01",
    eyebrow: "WEBSITES",
    title: "A website that earns its place in your business.",
    copy: "Your site should make you look established, answer the right questions, and give visitors a clear next step. We handle the strategy, design, build, and launch without making you learn a new language.",
    includes: ["Content and page planning", "Custom responsive design", "Contact or lead forms", "Basic on-page search setup", "Domain and launch support", "Walkthrough before handoff"],
    fits: "Local services, restaurants, makers, consultants, and growing businesses that need a credible home online.",
  },
  {
    id: "stores",
    number: "02",
    eyebrow: "ONLINE STORES",
    title: "Make buying from you feel easy.",
    copy: "We build storefronts around how you actually sell, whether customers need shipping, local pickup, custom order requests, or a focused catalog that is simple for you to maintain.",
    includes: ["Store and catalog setup", "Secure payment connection", "Shipping or pickup rules", "Core policy pages", "Order notification setup", "Store management training"],
    fits: "Product businesses ready to sell directly online without wrestling with a complicated store every day.",
  },
  {
    id: "systems",
    number: "03",
    eyebrow: "BUSINESS SYSTEMS",
    title: "Run the work behind your website, too.",
    copy: "Our Business Hub foundation can be shaped around the way your company actually works. Start with a focused customer and project system, then add the modules your team needs without paying for a pile of tools you never use.",
    includes: ["Customer and lead management", "Projects, tasks, and scheduling", "Estimates, invoices, and payment records", "Client portal and messaging", "Files, reporting, and permissions", "Business-specific setup and training"],
    fits: "Service businesses, restaurants, appointment-based teams, contractors, and growing companies ready to replace disconnected spreadsheets, inboxes, and subscriptions.",
  },
  {
    id: "support",
    number: "04",
    eyebrow: "ONGOING SUPPORT",
    title: "A real person who already knows your business.",
    copy: "Launch is not the end of the relationship. Care plans keep your site healthy and give you a dependable place to go for updates, improvements, and honest answers.",
    includes: ["Routine site maintenance", "Backups and security checks", "Content and image updates", "Performance monitoring", "Plain-English support", "Recommendations as you grow"],
    fits: "Owners who want their technology handled without hiring an employee or chasing a different freelancer every time.",
  },
  {
    id: "onsite-it",
    number: "05",
    eyebrow: "ONSITE IT & HARDWARE",
    title: "Hands-on help when the problem is in the room.",
    copy: "For Phoenix area businesses, Pixel Hutch can install and troubleshoot the everyday equipment that keeps work moving, from computers and printers to workstations, networks, and new office setups.",
    includes: ["Computer and workstation setup", "Printer and peripheral installation", "Basic network and Wi-Fi troubleshooting", "Software and account setup", "New-office technology setup", "Plain-English recommendations"],
    fits: "Businesses that need dependable onsite support without the cost of a full time IT department.",
  },
];

const packages = [
  { name: "Starter Site", price: "$1,495", note: "Up to 5 pages", items: ["Custom mobile-friendly design", "Contact form", "Basic search setup", "Launch support"] },
  { name: "Business Site", price: "$2,495", note: "More room to grow", items: ["Expanded page count", "Stronger search setup", "Business integrations", "Custom functionality"], featured: true },
  { name: "Online Store", price: "From $3,495", note: "Sell products online", items: ["Product catalog", "Secure payments", "Shipping or pickup setup", "Management training"] },
];

const faqs = [
  ["How long does a website take?", "Most business websites take about four to eight weeks once we have the content and feedback needed to keep moving. More complex stores and systems are planned individually."],
  ["Do I own my website?", "Yes. Once the final invoice is paid, the custom site content and design produced for your project are yours. Third-party platforms, fonts, apps, and subscriptions remain subject to their own licenses."],
  ["Can you work with my current domain?", "Absolutely. You keep your existing domain. We help connect it to the new site and make the launch as smooth as possible."],
  ["Do I have to join a care plan?", "No. A care plan is recommended if you want ongoing updates and support, but it is not required unless a particular project depends on managed services we agree on beforehand."],
];

function PixelReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`pixel-reveal ${visible ? "is-visible" : ""} ${className}`}>{children}<div className="pixel-cover" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} />)}</div></div>;
}

export default function ServicesPage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pixel Hutch home"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch, precision solutions for your business" /></a>
        <nav aria-label="Primary navigation">
          <a className="nav-active" href="/services">Services &amp; Pricing</a><a href="/work">Our work</a><a href="/#process">Process</a><a href="/about">About</a>
        </nav>
        <a className="button button-small" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <section className="services-hero section-shell" id="top">
        <p className="eyebrow"><span /> Practical help for real businesses</p>
        <div className="services-hero-grid">
          <h1>TOOLS THAT<br /><em>LIGHTEN</em><br />THE LOAD.</h1>
          <div><p>We build the parts of your business customers see and the systems behind the scenes that keep everything moving.</p><a className="button" href="#pricing-details">See packages <span aria-hidden="true">↓</span></a></div>
        </div>
        <div className="service-jump" aria-label="Jump to a service">{offers.map((offer) => <a href={`#${offer.id}`} key={offer.id}><span>{offer.number}</span>{offer.eyebrow}</a>)}</div>
      </section>

      <section className="offer-list">
        {offers.map((offer, index) => (
          <article className={`offer-row ${index % 2 ? "offer-row-alt" : ""}`} id={offer.id} key={offer.id}>
            <div className="section-shell offer-grid">
              <div className="offer-index"><span>{offer.number}</span><i aria-hidden="true" /></div>
              <PixelReveal className="offer-main"><p className="kicker">{offer.eyebrow}</p><h2>{offer.title}</h2><p className="offer-copy">{offer.copy}</p></PixelReveal>
              <div className="offer-detail"><p className="detail-label">WHAT&apos;S INCLUDED</p><ul>{offer.includes.map((item) => <li key={item}>{item}</li>)}</ul><p className="detail-label">A GOOD FIT FOR</p><p>{offer.fits}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="services-pricing" id="pricing-details">
        <div className="section-shell">
          <div className="section-intro pricing-intro"><p className="kicker">WEBSITE PACKAGES</p><h2>Clear starting points. No mystery math.</h2><p>We confirm the scope and total price before work begins. If your project needs something outside a package, you will know before it becomes a bill.</p></div>
          <div className="pricing-grid">{packages.map((item) => <PixelReveal className={`pricing-card ${item.featured ? "pricing-featured" : ""}`} key={item.name}>{item.featured && <span className="popular-label">MOST POPULAR</span>}<p className="package-name">{item.name}</p><h3>{item.price}</h3><p>{item.note}</p><ul>{item.items.map((feature) => <li key={feature}>{feature}</li>)}</ul><a className="text-link" href="/contact">Ask about this package <span aria-hidden="true">↗</span></a></PixelReveal>)}</div>

          <div className="plan-heading"><p className="kicker">AFTER LAUNCH</p><h2>Choose support that fits how you work.</h2></div>
          <div className="care-comparison">
            <div><p className="package-name">ESSENTIAL CARE</p><h3>$99<span>/month</span></h3><p>Reliable upkeep for businesses that only need occasional changes.</p><ul><li>Hosting coordination</li><li>Security and backups</li><li>Minor content updates</li><li>Standard support</li></ul></div>
            <div><p className="package-name">GROWTH CARE</p><h3>$199<span>/month</span></h3><p>More hands-on help for businesses actively improving their online presence.</p><ul><li>Everything in Essential</li><li>More monthly edits</li><li>Reporting and search monitoring</li><li>Priority support</li></ul></div>
            <div className="custom-callout"><p className="package-name">PIXEL HUTCH BUSINESS HUB</p><h3>Start with the core. Add what fits.</h3><p>A configurable CRM foundation for customers, projects, billing, files, scheduling, reporting, and client access, adapted to your business rather than rebuilt from zero.</p><a className="button button-dark" href="/contact">Ask about a business system <span aria-hidden="true">↗</span></a></div>
          </div>
          <p className="pricing-note">Projects begin with a 50% deposit. The remaining 25% is due after design approval and 25% before launch. Domains, paid third-party services, photography, copywriting, and unusual integrations are quoted separately.</p>
        </div>
      </section>

      <section className="faq section-shell">
        <div className="faq-heading"><p className="kicker">GOOD TO KNOW</p><h2>Questions before we start.</h2></div>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="services-cta section-shell"><div><p className="kicker kicker-light">NOT SURE WHICH ONE YOU NEED?</p><h2>Start with the problem.<br />We&apos;ll help with the solution.</h2></div><a className="button button-dark" href="/contact">Start a conversation <span aria-hidden="true">↗</span></a></section>

      <footer><a className="footer-brand" href="/"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>PIXEL HUTCH</strong></a><p>Websites, systems, and support for businesses.</p><div><img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" /><span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span></div></footer>
    </main>
  );
}
