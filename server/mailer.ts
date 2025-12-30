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
  title?: string;
}): Promise<{ success: boolean; sentCount: number }> {
  const transport = getTransporter();

  if (!transport) {
    console.log("[Mailer] Skipping email - SMTP not configured");
    return { success: false, sentCount: 0 };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NurseBrace</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #2d3748;
        }

        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .content-padding { padding: 30px 20px !important; }
        }
    </style>
</head>
<body>
    <center>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff;">
                        <tr>
                            <td align="center" style="padding: 35px 40px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="left" style="font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 700; color: #3b82f6; letter-spacing: -1px;">
                                            Nurse<span style="color: #1e3a8a;">Brace</span>
                                        </td>
                                        <td align="right" style="font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">
                                            Exam Prep Excellence
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td class="content-padding" style="padding: 50px 40px; font-family: 'Montserrat', sans-serif;">
                                ${data.title ? `<h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #1e3a8a;">${data.title}</h2>` : ''}
                                <div style="min-height: 100px; color: #475569; line-height: 1.7; font-size: 16px;">
                                    ${data.message.replace(/\n/g, '<br/>')}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 45px 40px; background-color: #f8fafc; font-family: 'Montserrat', sans-serif; border-top: 1px solid #f1f5f9;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
                                    <tr>
                                        <td style="padding-top: 5px;">
                                            <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1e3a8a;">
                                                Questions? Email us: <a href="mailto:nursebracehelp@gmail.com" style="color: #3b82f6; text-decoration: none;">nursebracehelp@gmail.com</a>
                                            </p>
                                            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                                                &copy; 2025 NurseBrace. Empowering the next generation of nurses.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 30px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                Dedicated to your Nursing Journey
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
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

