function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function sendClientFormEmail(request: Request, input: {
  to: string; customerName: string; businessName: string; formTitle: string;
  leadId: number; message?: string; action: "requested" | "updated" | "completed";
}) {
  const { env } = await import("cloudflare:workers");
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  const origin = new URL(request.url).origin;
  const portalUrl = `${origin}/portal?project=${input.leadId}`;
  const actionCopy = input.action === "requested"
    ? "A new form is ready for your review or completion."
    : input.action === "completed"
      ? "Your form was received successfully. A copy remains available in your portal."
      : "A form connected to your project has been updated.";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || "Pixel Hutch <updates@pixel-hutch.com>",
      to: [input.to],
      subject: `${input.formTitle} — Pixel Hutch`,
      html: `<div style="margin:auto;max-width:620px;padding:32px;font-family:Arial,sans-serif;color:#30343a">
        <div style="border-top:8px solid #f54702;padding-top:24px">
          <img src="${origin}/pixel-hutch-logo.svg" alt="Pixel Hutch" style="height:48px">
          <p style="margin:24px 0 6px;color:#f54702;font-size:11px;font-weight:bold;letter-spacing:1.4px">CLIENT PROJECT UPDATE</p>
          <h1 style="margin:0 0 14px;font-size:26px">${escapeHtml(input.formTitle)}</h1>
          <p style="font-size:16px;line-height:1.6">Hi ${escapeHtml(input.customerName)},</p>
          <p style="font-size:16px;line-height:1.6">${actionCopy}</p>
          ${input.message ? `<div style="margin:20px 0;padding:15px 18px;border-left:4px solid #f54702;background:#f6f6f6">${escapeHtml(input.message)}</div>` : ""}
          <p><a href="${portalUrl}" style="display:inline-block;border-radius:8px;background:#f54702;padding:13px 20px;color:white;text-decoration:none;font-weight:bold">Open client portal</a></p>
          <p style="margin-top:30px;color:#73777d;font-size:13px">This update is connected to ${escapeHtml(input.businessName)}. Reply to this email if you need help.</p>
        </div>
      </div>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected the message (${response.status}).`);
}
