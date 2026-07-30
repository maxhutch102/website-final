"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const result = await response.json();
      if (result.leadCaptured) {
        formElement.reset();
        setSent(true);
        if (!response.ok) setEmailWarning(result.error || "Your inquiry was saved, but the confirmation email could not be sent.");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Your inquiry could not be sent.");
      formElement.reset();
      setSent(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Your inquiry could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pixel Hutch home"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch, precision solutions for your business" /></a>
        <nav aria-label="Primary navigation">
          <a href="/services">Services &amp; Pricing</a><a href="/work">Our work</a><a href="/#process">Process</a><a href="/about">About</a>
        </nav>
        <a className="button button-small nav-active-button" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <section className="contact-hero section-shell" id="top">
        <div>
          <p className="eyebrow"><span /> Start with the problem, not the tech</p>
          <h1>LET&apos;S BUILD<br /><em>SOMETHING</em><br />USEFUL.</h1>
        </div>
        <div className="contact-hero-note">
          <p>Tell me what you&apos;re trying to improve, even if you don&apos;t know exactly what you need yet. I&apos;ll read it personally and help you find the clearest next step.</p>
          <div><span>DIRECT EMAIL</span><a href="mailto:max@pixel-hutch.com">max@pixel-hutch.com ↗</a></div>
          <div><span>BASED IN</span><strong>Arizona · Working remotely</strong></div>
        </div>
      </section>

      <div className="trust-strip"><span>NO HARD SELL</span><i /><span>PLAIN-ENGLISH ANSWERS</span><i /><span>YOU TALK DIRECTLY WITH MAX</span></div>

      <section className="inquiry-section section-shell">
        <div className="inquiry-intro">
          <p className="kicker">TELL ME ABOUT YOUR PROJECT</p>
          <h2>A few details now make the first conversation much more useful.</h2>
          <p>There is no commitment. This just gives me enough context to understand the problem and come prepared with good questions.</p>
          <div className="response-note"><b>WHAT HAPPENS NEXT</b><p>I&apos;ll review your note, reply personally, and suggest a short conversation if Pixel Hutch looks like a good fit.</p></div>
        </div>

        {sent ? (
          <div className="contact-success" role="status">
            <span aria-hidden="true">✓</span>
            <p className="kicker">MESSAGE SENT</p>
            <h2>Your inquiry made it to Max.</h2>
            <p>{emailWarning || "We sent a confirmation to the email address you entered. Max will review your project details and reply personally."}</p>
            <a className="button" href="/">Back to Pixel Hutch <span aria-hidden="true">↗</span></a>
          </div>
        ) : (
          <form className="inquiry-form" onSubmit={handleSubmit}>
            <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <div className="form-section-label"><span>01</span><b>ABOUT YOU</b></div>
            <div className="form-grid">
              <label>Your name<input name="name" autoComplete="name" required /></label>
              <label>Business name<input name="business" autoComplete="organization" required /></label>
              <label>Email address<input type="email" name="email" autoComplete="email" required /></label>
              <label>Phone <small>Optional</small><input type="tel" name="phone" autoComplete="tel" /></label>
            </div>

            <div className="form-section-label"><span>02</span><b>ABOUT THE PROJECT</b></div>
            <div className="form-grid">
              <label>What do you need?<select name="project" defaultValue="" required><option value="" disabled>Select one</option><option>New website</option><option>Website redesign</option><option>Online store</option><option>Business system or CRM</option><option>Onsite IT or hardware support</option><option>Ongoing support</option><option>Not sure yet</option></select></label>
              <label>Approximate budget<select name="budget" defaultValue="" required><option value="" disabled>Select a range</option><option>Under $1,500</option><option>$1,500–$2,500</option><option>$2,500–$5,000</option><option>$5,000+</option><option>I need guidance</option></select></label>
              <label>Ideal timeline<select name="timeline" defaultValue="" required><option value="" disabled>Select one</option><option>As soon as possible</option><option>Within 1–2 months</option><option>Within 3–6 months</option><option>Just exploring</option></select></label>
              <label>How did you hear about us?<select name="referral" defaultValue=""><option value="" disabled>Select one</option><option>Referral</option><option>Google or web search</option><option>Social media</option><option>Local event</option><option>Other</option></select></label>
            </div>
            <label className="message-field">What are you trying to build or fix?<textarea name="message" rows={7} placeholder="Tell me what is happening now, what is frustrating, and what a better result would look like." required /></label>
            {error && <p className="contact-error" role="alert">{error} You can also email <a href="mailto:max@pixel-hutch.com">max@pixel-hutch.com</a>.</p>}
            <div className="form-submit-row"><button className="button" type="submit" disabled={sending}>{sending ? "Sending…" : "Send my inquiry"} <span aria-hidden="true">↗</span></button><p>Your details are sent securely. You&apos;ll receive a confirmation by email.</p></div>
          </form>
        )}
      </section>

      <section className="contact-bottom section-shell">
        <p className="kicker kicker-light">NOT SURE YOU&apos;RE READY?</p>
        <h2>That&apos;s completely fine.</h2>
        <p>You do not need a perfect plan, finished copy, or a technical vocabulary. Start with what is slowing you down, and we&apos;ll figure out the right next question together.</p>
      </section>

      <footer><a className="footer-brand" href="/"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>PIXEL HUTCH</strong></a><p>Websites, systems, and support for businesses.</p><div><img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" /><span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span></div></footer>
    </main>
  );
}
