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

export async function sendBulkEmail(data: {
  emails: string[];
  subject: string;
  message: string;
}): Promise<{ success: boolean; sentCount: number }> {
  const transport = getTransporter();

  if (!transport) {
    console.log("[Mailer] Skipping email - SMTP not configured");
    return { success: false, sentCount: 0 };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; }
          .header { background: #145078; padding: 32px 40px; color: #ffffff; }
          .header h1 { margin: 0; font-family: 'Merriweather', serif; font-size: 28px; letter-spacing: -0.02em; }
          .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px; min-height: 200px; }
          .footer { background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; }
          .footer p { margin: 0; font-size: 13px; color: #64748b; font-weight: 600; }
          .footer span { font-size: 11px; color: #94a3b8; display: block; margin-top: 4px; font-weight: 400; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NurseBrace</h1>
            <p>Adaptive Nursing Exam Preparation</p>
          </div>
          <div class="content">
            ${data.message.replace(/\n/g, '<br/>')}
          </div>
          <div class="footer">
            <p>NurseBrace</p>
            <span>FOR EDUCATIONAL USE ONLY</span>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transport.sendMail({
      from: SMTP_FROM,
      to: data.emails.join(", "),
      subject: data.subject,
      text: data.message,
      html: htmlContent,
    });

    console.log("[Mailer] Bulk email sent successfully:", info.messageId);
    return { success: true, sentCount: data.emails.length };
  } catch (error) {
    console.error("[Mailer] Failed to send bulk email:", error);
    return { success: false, sentCount: 0 };
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

