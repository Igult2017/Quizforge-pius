import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "nursebracehelp@gmail.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[Mailer] SMTP credentials not configured. Email sending disabled.");
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendSupportEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log("[Mailer] Skipping email - SMTP not configured");
    return false;
  }

  const htmlContent = `
    <h2>New Support Message - NurseBrace</h2>
    <hr/>
    <h3>Contact Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${data.name}</li>
      <li><strong>Email:</strong> ${data.email}</li>
      <li><strong>Subject:</strong> ${data.subject}</li>
    </ul>
    <h3>Message:</h3>
    <p>${data.message.replace(/\n/g, '<br/>')}</p>
    <hr/>
    <p><em>Sent automatically by NurseBrace</em></p>
  `;

  const textContent = `
New Support Message - NurseBrace

Contact Details:
- Name: ${data.name}
- Email: ${data.email}
- Subject: ${data.subject}

Message:
${data.message}
  `;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: SUPPORT_EMAIL,
      subject: `[NurseBrace Support] ${data.subject}`,
      text: textContent,
      html: htmlContent,
      replyTo: data.email,
    });

    console.log("[Mailer] Support email sent successfully");
    return true;
  } catch (error) {
    console.error("[Mailer] Failed to send support email:", error);
    return false;
  }
}

export async function sendPaymentLeadNotification(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  plan: string;
}): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log("[Mailer] Skipping email - SMTP not configured");
    return false;
  }

  const planNames: Record<string, string> = {
    weekly: "Weekly Plan ($19.99)",
    monthly: "Monthly Plan ($49.99)",
  };

  const planDisplay = planNames[data.plan] || data.plan;

  const htmlContent = `
    <h2>New Payment Lead - NurseBrace</h2>
    <p>A user attempted to make a payment while the system was down.</p>
    <hr/>
    <h3>Customer Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
      <li><strong>Email:</strong> ${data.email}</li>
      <li><strong>Phone:</strong> ${data.phone || "Not provided"}</li>
      <li><strong>Selected Plan:</strong> ${planDisplay}</li>
    </ul>
    <hr/>
    <p>Please reach out to this customer to assist them with their subscription.</p>
    <p><em>Sent automatically by NurseBrace</em></p>
  `;

  const textContent = `
New Payment Lead - NurseBrace

A user attempted to make a payment while the system was down.

Customer Details:
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.email}
- Phone: ${data.phone || "Not provided"}
- Selected Plan: ${planDisplay}

Please reach out to this customer to assist them with their subscription.
  `;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: SUPPORT_EMAIL,
      subject: `[NurseBrace] New Payment Lead: ${data.firstName} ${data.lastName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log("[Mailer] Lead notification sent successfully");
    return true;
  } catch (error) {
    console.error("[Mailer] Failed to send lead notification:", error);
    return false;
  }
}

