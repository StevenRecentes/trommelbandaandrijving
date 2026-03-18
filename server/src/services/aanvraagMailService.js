const nodemailer = require("nodemailer");

function createTransportIfConfigured() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || "";
  const secure = String(process.env.SMTP_SECURE || "0") === "1";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendAanvraagEmails({ aanvraag, pdfPath }) {
  const transport = createTransportIfConfigured();
  const targetTba = process.env.TBA_AANVRAAG_EMAIL || "";

  if (!transport) {
    return { skipped: true, reason: "SMTP not configured" };
  }

  const recipients = [aanvraag.klant_email, targetTba].filter(Boolean);
  if (!recipients.length) {
    return { skipped: true, reason: "No recipients configured" };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || "noreply@trommel.local",
    to: recipients.join(","),
    subject: `Aanvraag #${aanvraag.id} - Trommelmotor selectie`,
    text: `De aanvraag #${aanvraag.id} is definitief gemaakt. Zie bijlage voor details.`,
    attachments: pdfPath ? [{ path: pdfPath, filename: `aanvraag-${aanvraag.id}.pdf` }] : [],
  });

  return { skipped: false };
}

module.exports = {
  sendAanvraagEmails,
};
