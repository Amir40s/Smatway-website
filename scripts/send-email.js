const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Helper to parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../apps/api/.env');
  if (!fs.existsSync(envPath)) {
    console.error(`Error: .env file not found at ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        // Remove surrounding quotes if they exist
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

// Load env variables
loadEnv();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT ?? '465', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || 'SmatWay <noreply@smatway.com>';

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error('Error: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not fully set in apps/api/.env');
  process.exit(1);
}

// Get recipient, subject, and body from CLI arguments or use defaults
const toEmail = process.argv[2] || 'info@moblade.com';
const subject = process.argv[3] || 'SmatWay System Alert / Test Mail';
const bodyText = process.argv[4] || 'This is a test email sent from the SmatWay script.';

console.log('Sending email with the following configuration:');
console.log(`- SMTP Host: ${smtpHost}`);
console.log(`- SMTP Port: ${smtpPort}`);
console.log(`- SMTP User: ${smtpUser}`);
console.log(`- From:      ${mailFrom}`);
console.log(`- To:        ${toEmail}`);
console.log(`- Subject:   ${subject}`);

const isSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const htmlContent = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e1e1e1;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0d9488; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">SmatWay</h1>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Developer & System Utilities</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); border-top: 4px solid #10b981;">
      <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 15px; font-weight: 600;">System Notification</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
        ${bodyText.replace(/\n/g, '<br>')}
      </p>
      
      <div style="background-color: #f3f4f6; border-left: 4px solid #9ca3af; padding: 15px; margin-bottom: 20px; font-family: monospace; font-size: 13px; color: #374151;">
        <strong>Details:</strong><br>
        Timestamp: ${new Date().toLocaleString()}<br>
        Trigger: CLI Script Execution
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0;">This email was automatically generated and sent via SmatWay Mailer utility.</p>
      <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} SmatWay. All rights reserved.</p>
    </div>
  </div>
`;

transporter.sendMail({
  from: mailFrom,
  to: toEmail,
  subject: subject,
  text: bodyText,
  html: htmlContent,
}, (err, info) => {
  if (err) {
    console.error('Error sending email:', err);
    process.exit(1);
  } else {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  }
});
