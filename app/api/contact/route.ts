import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs, leads } from "@/db/schema";

const CONTACT_EMAIL = "max@pixel-hutch.com";
const FROM_EMAIL = "Pixel Hutch <notifications@pixel-hutch.com>";

function text(value: unknown, maxLength = 4000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 14px 8px 0;color:#777;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;font-weight:700">${escapeHtml(value || "Not provided")}</td></tr>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (text(body.website)) {
      return NextResponse.json({ ok: true });
    }

    const inquiry = {
      name: text(body.name, 120),
      business: text(body.business, 160),
      email: text(body.email, 254).toLowerCase(),
      phone: text(body.phone, 40),
      project: text(body.project, 100),
      budget: text(body.budget, 100),
      timeline: text(body.timeline, 100),
      referral: text(body.referral, 120),
      message: text(body.message, 6000),
    };

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inquiry.name || !inquiry.business || !emailPattern.test(inquiry.email) || !inquiry.project || !inquiry.budget || !inquiry.timeline || !inquiry.message) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    /*
     * The website inquiry is the source of truth for lead generation. Save it
     * before attempting email delivery so a temporary email-provider problem
     * cannot make a real prospect disappear. The short duplicate window also
     * makes retrying the form safe when a browser loses the first response.
     */
    const now = new Date().toISOString();
    const duplicateCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const db = await getDb();
    const existing = await db.select({ id: leads.id }).from(leads).where(and(
      eq(leads.email, inquiry.email),
      eq(leads.project, inquiry.project),
      eq(leads.message, inquiry.message),
      gte(leads.createdAt, duplicateCutoff),
    )).orderBy(desc(leads.createdAt)).limit(1);

    let leadId = existing[0]?.id;
    if (!leadId) {
      const created = await db.insert(leads).values({
        ...inquiry,
        referral: inquiry.referral || "Pixel Hutch website",
        status: "new",
        estimatedValue: 0,
        notes: "",
        createdAt: now,
        updatedAt: now,
      }).returning({ id: leads.id });
      leadId = created[0].id;

      await db.insert(activityLogs).values({
        actorEmail: "website@pixel-hutch.com",
        actorName: "Pixel Hutch website",
        actorRole: "system",
        action: "lead.captured",
        entityType: "lead",
        entityId: String(leadId),
        summary: `Created customer lead for ${inquiry.business} from the public inquiry form.`,
        createdAt: now,
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Your inquiry was saved, but the confirmation email could not be sent. Max can still see your request.",
        leadCaptured: true,
        leadId,
      }, { status: 503 });
    }

    const details = [
      row("Name", inquiry.name),
      row("Business", inquiry.business),
      row("Email", inquiry.email),
      row("Phone", inquiry.phone),
      row("Project type", inquiry.project),
      row("Budget", inquiry.budget),
      row("Timeline", inquiry.timeline),
      row("Referral", inquiry.referral),
    ].join("");

    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          from: FROM_EMAIL,
          to: [CONTACT_EMAIL],
          reply_to: inquiry.email,
          subject: `New Pixel Hutch inquiry — ${inquiry.business}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:680px;color:#464646"><h1 style="color:#f54702">New project inquiry</h1><table style="border-collapse:collapse">${details}</table><h2 style="margin-top:28px">What they want to build or fix</h2><p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(inquiry.message)}</p></div>`,
        },
        {
          from: FROM_EMAIL,
          to: [inquiry.email],
          reply_to: CONTACT_EMAIL,
          subject: "We received your Pixel Hutch inquiry",
          html: `<div style="font-family:Arial,sans-serif;max-width:620px;color:#464646"><div style="border-top:8px solid #f54702;padding-top:24px"><h1>Thanks, ${escapeHtml(inquiry.name)}.</h1><p style="font-size:17px;line-height:1.6">Your project inquiry made it safely to Pixel Hutch. I’ll review what you shared and reply personally at this email address.</p><p style="font-size:17px;line-height:1.6">You don’t need to prepare anything else in the meantime. If there’s an important detail you forgot, just reply to this message.</p><p style="margin-top:30px"><strong>Max Hutchison</strong><br>Pixel Hutch<br><a href="https://pixel-hutch.com" style="color:#f54702">pixel-hutch.com</a></p></div></div>`,
        },
      ]),
    });

    if (!response.ok) {
      console.error("Resend contact error", response.status, await response.text());
      return NextResponse.json({
        error: "Your inquiry was saved, but the confirmation email could not be sent. Max can still see your request.",
        leadCaptured: true,
        leadId,
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, leadCaptured: true, leadId });
  } catch (error) {
    console.error("Contact form error", error);
    return NextResponse.json({ error: "Your inquiry could not be sent. Please try again." }, { status: 500 });
  }
}
