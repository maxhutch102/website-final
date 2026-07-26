export async function sendClientWelcomeEmail(request: Request, input: {
  to: string; customerName: string; businessName: string; leadId: number; token: string;
}) {
  const { env } = await import("cloudflare:workers");
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  const origin = new URL(request.url).origin;
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(input.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || "Pixel Hutch <welcome@pixel-hutch.com>",
      to: [input.to],
      subject: `Welcome to your Pixel Hutch client portal`,
      html: `<div style="margin:auto;max-width:620px;padding:32px;font-family:Arial,sans-serif;color:#30343a">
        <div style="border-top:8px solid #f54702;padding-top:24px">
          <img src="${origin}/pixel-hutch-logo.svg" alt="Pixel Hutch" style="height:50px">
          <p style="margin:24px 0 6px;color:#f54702;font-size:11px;font-weight:bold;letter-spacing:1.4px">YOUR CLIENT ACCOUNT</p>
          <h1 style="margin:0 0 16px;font-size:28px">Welcome, ${input.customerName}.</h1>
          <p style="font-size:16px;line-height:1.6">Your secure Pixel Hutch portal for <strong>${input.businessName}</strong> is ready.</p>
          <p style="font-size:16px;line-height:1.6">Use it to complete forms, approve project details, upload files, review invoices, and see updates in one place.</p>
          <p><a href="${link}" style="display:inline-block;border-radius:8px;background:#f54702;padding:13px 20px;color:white;text-decoration:none;font-weight:bold">Activate my client account</a></p>
          <p style="color:#73777d;font-size:13px">This activation link expires in 20 minutes. Afterward, request a fresh secure link from the client login page.</p>
        </div>
      </div>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected the message (${response.status}).`);
}
