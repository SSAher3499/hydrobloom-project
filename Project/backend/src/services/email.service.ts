import nodemailer from 'nodemailer';

const isDev = process.env.NODE_ENV !== 'production';

// Helper to safely parse port with validation
function parsePort(portStr: string | undefined, defaultPort: number): number {
  if (!portStr) return defaultPort;
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn(`Invalid port "${portStr}", using default: ${defaultPort}`);
    return defaultPort;
  }
  return port;
}

let transporter: nodemailer.Transporter;

if (isDev && process.env.MH_HOST) {
  // MailHog (local docker) – fastest dev loop
  transporter = nodemailer.createTransport({
    host: process.env.MH_HOST,
    port: parsePort(process.env.MH_PORT, 1025),
  });
} else if (isDev) {
  // Mailtrap sandbox
  const mtUser = process.env.MT_USER;
  const mtPass = process.env.MT_PASS;

  if (!mtUser || !mtPass) {
    throw new Error(
      'Mailtrap credentials missing: MT_USER and MT_PASS are required in development. ' +
      'Set them in backend/.env or use MailHog by setting MH_HOST.'
    );
  }

  transporter = nodemailer.createTransport({
    host: process.env.MT_HOST || 'sandbox.smtp.mailtrap.io',
    port: parsePort(process.env.MT_PORT, 2525),
    auth: { user: mtUser, pass: mtPass }
  });
} else {
  // Production: SendGrid SMTP
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!sendgridKey) {
    throw new Error(
      'SENDGRID_API_KEY is required in production. ' +
      'Set it in backend/.env or environment variables.'
    );
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: { user: 'apikey', pass: sendgridKey }
  });
}

export async function sendOtpEmail(to: string, code: string) {
  return transporter.sendMail({
    from: 'HydroBloom Auth <no-reply@hydrobloom.app>',
    to,
    subject: 'Your sign-in code',
    text: `Your code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your sign-in code is <b style="font-size:18px;letter-spacing:2px">${code}</b></p>
           <p>This code expires in 10 minutes.</p>`
  });
}
