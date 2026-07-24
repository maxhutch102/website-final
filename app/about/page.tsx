"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { ReactNode, useEffect, useRef, useState } from "react";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

const values = [
  ["01", "Useful over flashy", "Good design matters, but the finished product also has to save time, reduce friction, or help your business earn trust."],
  ["02", "Plain English", "You should understand what we are building, what it costs, and why it matters without needing to become a technology expert."],
  ["03", "Built around people", "Your business already has its own way of working. We listen first, then shape the technology around the people who will actually use it."],
  ["04", "Here after launch", "We want to become the person you call when something needs to change, improve, or finally stop being a headache."],
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

export default function AboutPage() {
  return (
    <main>
      <SiteHeader active="about" />

      <section className="about-hero section-shell" id="top">
        <div className="about-hero-copy">
          <p className="eyebrow"><span /> Arizona grown. Business focused.</p>
          <h1>TECH SHOULD<br /><em>HELP.</em><br />NOT HINDER.</h1>
          <p>Pixel Hutch gives businesses a practical technology partner: someone who listens, solves the real problem, and explains the answer like a human being.</p>
        </div>
        <div className="about-portrait" aria-label="Max and Teshya Hutchison in the Arizona desert">
          <div className="founder-card">
            <div className="founder-photo"><img src="/max-teshya-cactus.webp" alt="Max kissing Teshya beside tall cacti in Arizona" /></div>
            <p className="kicker">MEET THE HUTCHISONS</p>
            <h2>Max + Teshya</h2>
            <p>Problem-solvers, builders, parents, and the family behind Pixel Hutch.</p>
          </div>
          <i className="founder-pixel fp-one" /><i className="founder-pixel fp-two" /><i className="founder-pixel fp-three" />
        </div>
      </section>

      <div className="trust-strip"><span>FAMILY OWNED</span><i /><span>ARIZONA BASED</span><i /><span>REAL PEOPLE. USEFUL TOOLS.</span></div>

      <section className="founder-story section-shell">
        <p className="kicker">THE STORY BEHIND THE HUTCH</p>
        <PixelReveal className="story-headline"><h2>I spent years fixing complicated operations. Then I realized more businesses deserved the same kind of help.</h2></PixelReveal>
        <div className="story-copy">
          <p>Before Pixel Hutch, I spent years leading production and logistics teams, improving broken processes, building tracking systems, and solving the problems that show up when real people have real work to get done.</p>
          <p>That experience taught me something important: technology is only useful when it makes the work clearer. A beautiful website that confuses customers is not useful. A complicated system nobody wants to use is not useful. And support that disappears after the invoice is paid is not much support at all.</p>
          <p>I started Pixel Hutch to bring practical, capable technology help to the businesses that rarely get enough of it. We build websites, systems, and ongoing support around how your business actually works, not around a generic template or a pile of technical jargon.</p>
        </div>
      </section>

      <section className="about-experience">
        <div className="section-shell experience-grid">
          <div><p className="kicker kicker-light">WHAT I BRING TO THE TABLE</p><h2>More than web design.</h2><p>Pixel Hutch combines technical building with the kind of operational thinking that comes from managing people, customers, deadlines, and messy real-world processes.</p></div>
          <div className="experience-list">
            <span>18+ years leading and serving customers</span>
            <span>Large-team operations leadership</span>
            <span>Workflow and process improvement</span>
            <span>Hands-on website and systems building</span>
          </div>
        </div>
      </section>

      <section className="values section-shell">
        <div className="section-intro"><p className="kicker">HOW WE WORK</p><h2>Built on a few simple promises.</h2><p>Technology projects feel better when expectations are clear and the person helping you genuinely cares whether the result works.</p></div>
        <div className="values-grid">{values.map(([number, title, copy]) => <PixelReveal className="value-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></PixelReveal>)}</div>
      </section>

      <section className="family-note section-shell">
        <div className="family-photo"><img src="/hutchison-family.webp" alt="Max, Teshya, and their sons enjoying a baseball game together" /></div>
        <div><p className="kicker">WHY “HUTCH”?</p><h2>This business is personal.</h2><p>Pixel Hutch is part of a bigger family dream: creating useful things, building businesses we believe in, and making a life with more freedom and more time together. When you work with Pixel Hutch, you work directly with Max, not a rotating account manager or a faceless support queue.</p></div>
      </section>

      <section className="services-cta section-shell"><div><p className="kicker kicker-light">LET&apos;S MAKE SOMETHING BETTER</p><h2>Tell me what is slowing<br />your business down.</h2></div><a className="button button-dark" href="/contact">Talk directly with Max <span aria-hidden="true">↗</span></a></section>

      <SiteFooter />
    </main>
  );
}
