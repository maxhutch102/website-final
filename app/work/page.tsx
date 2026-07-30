"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { ReactNode, useEffect, useRef, useState } from "react";

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

const projects = [
  {
    eyebrow: "CUSTOM CRM + CLIENT PORTAL",
    title: "Pixel Hutch Business Hub",
    status: "Private beta",
    copy: "One connected system for leads, customers, projects, tasks, estimates, invoices, files, client communication, schedules, reporting, and daily business administration.",
    deliverables: ["Customer-first CRM", "Projects and task workflows", "Billing and client portal", "Reports, files, and scheduling"],
    visual: "business-hub",
  },
  {
    eyebrow: "WEBSITE + ONLINE SHOP",
    title: "Lady T’s Creative Studio",
    status: "In development",
    copy: "A colorful online home for Teshya’s one of a kind jewelry, custom resin work, furniture, and future creative projects. It is built to grow beyond a single product category.",
    deliverables: ["Brand-led website", "Online shop structure", "Custom-order pathway", "Mobile-first experience"],
    visual: "lady-t",
  },
  {
    eyebrow: "BRAND + WEBSITE + LEAD SYSTEM",
    title: "Pixel Hutch Website",
    status: "Working system",
    copy: "The site you’re using right now: a complete business sales experience with clear services, transparent pricing, qualified inquiries, automated email confirmations, and a foundation for a private CRM.",
    deliverables: ["Multi page website", "Direct inquiry form", "Email automation", "CRM ready lead data"],
    visual: "pixel-hutch",
  },
  {
    eyebrow: "BRAND + RESTAURANT CONCEPT",
    title: "Hutch Pizza",
    status: "Concept in development",
    copy: "A forward looking restaurant concept centered on scratch made food, wood fire, family, and an approachable neighborhood experience.",
    deliverables: ["Brand direction", "Menu focused website plan", "Event inquiry flow", "Scalable restaurant template"],
    visual: "hutch-pizza",
  },
];

export default function WorkPage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pixel Hutch home"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch, precision solutions for your business" /></a>
        <nav aria-label="Primary navigation">
          <a href="/services">Services &amp; Pricing</a><a className="nav-active" href="/work">Our work</a><a href="/#process">Process</a><a href="/about">About</a>
        </nav>
        <a className="button button-small" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <section className="work-hero section-shell" id="top">
        <div>
          <p className="eyebrow"><span /> Real businesses. Useful builds.</p>
          <h1>WORK THAT<br /><em>WORKS.</em></h1>
        </div>
        <div className="work-hero-copy">
          <p>Pixel Hutch is new. That means no padded portfolio and no pretending a concept is a finished client project.</p>
          <p>Here is what we are building, what each project solves, and how the same thinking can help your business.</p>
        </div>
      </section>

      <div className="trust-strip"><span>HONEST STATUS</span><i /><span>REAL PROCESS</span><i /><span>BUILT TO BE USED</span></div>

      <section className="portfolio-list section-shell">
        {projects.map((project, index) => (
          <article className="portfolio-row" key={project.title}>
            <div className="portfolio-meta"><span>0{index + 1}</span><p>{project.eyebrow}</p></div>
            <PixelReveal className={`portfolio-visual ${project.visual}`}>
              <div className="portfolio-browser">
                <div className="window-bar"><i /><i /><i /><b>{project.title}</b></div>
                {project.visual === "lady-t" && <div className="lt-scene"><span>CREATE<br />SOMETHING<br /><em>BEAUTIFUL.</em></span><div><i /><i /><i /></div></div>}
                {project.visual === "pixel-hutch" && <div className="ph-scene"><img src="/pixel-hutch-logo.svg" alt="" /><strong>BUILD A<br /><em>BETTER</em><br />BUSINESS.</strong><i /></div>}
                {project.visual === "hutch-pizza" && <div className="hp-scene"><div><b>H</b><i /></div><strong>WOOD FIRED.<br />FAMILY MADE.</strong></div>}
                {project.visual === "business-hub" && <div className="hub-scene"><aside><b>PH</b><i /><i /><i /><i /></aside><section><header><span>BUSINESS HUB</span><em>● LIVE</em></header><div className="hub-scene-stats"><i /><i /><i /></div><div className="hub-scene-grid"><strong /><span /></div></section></div>}
              </div>
            </PixelReveal>
            <div className="portfolio-copy">
              <div className="status-tag"><i />{project.status}</div>
              <h2>{project.title}</h2>
              <p>{project.copy}</p>
              <div className="portfolio-deliverables">{project.deliverables.map(item => <span key={item}>{item}</span>)}</div>
              {project.visual === "business-hub" && <a className="button button-small" href="/crm-demo">Try the CRM demo <span aria-hidden="true">↗</span></a>}
            </div>
          </article>
        ))}
      </section>

      <section className="work-principle">
        <div className="section-shell">
          <p className="kicker kicker-light">THE POINT ISN&apos;T JUST THE SCREEN</p>
          <h2>Every build should solve something.</h2>
          <div className="principle-grid"><p>A website should earn trust and create conversations.</p><p>A system should reduce chaos and make the next step obvious.</p><p>Support should give you a real person who knows your business.</p></div>
        </div>
      </section>

      <section className="services-cta section-shell"><div><p className="kicker kicker-light">YOUR BUSINESS COULD BE NEXT</p><h2>Let&apos;s build something<br />worth showing off.</h2></div><a className="button button-dark" href="/contact">Start your project <span aria-hidden="true">↗</span></a></section>

      <footer><a className="footer-brand" href="/"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>PIXEL HUTCH</strong></a><p>Websites, systems, and support for businesses.</p><div><img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" /><span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span></div></footer>
    </main>
  );
}
