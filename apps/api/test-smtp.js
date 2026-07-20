require("dotenv").config();
const nodemailer = require("nodemailer");

async function test(host, port, secure) {
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    requireTLS: !secure,
    auth: {
      user: "noreply@smatway.com",
      pass: ".Benjamino1.",
    },
  });

  try {
    await transporter.verify();
    console.log(`[SUCCESS] Connected to ${host}:${port}`);
    
    const info = await transporter.sendMail({
      from: '"Smatway Info" <noreply@smatway.com>',
      to: "info@moblade.com",
      subject: `Test SMTP connection via ${host}:${port}`,
      text: `This is a test email sent from smatway-master test-smtp.js using host ${host}:${port}.`,
      html: `<p>This is a test email sent from smatway-master test-smtp.js using host <b>${host}:${port}</b>.</p>`,
    });
    console.log(`[SUCCESS] Sent mail via ${host}:${port}. MessageId: ${info.messageId}`);
  } catch (err) {
    console.log(`[FAILED] ${host}:${port} - ${err.message || err}`);
  }
}

async function runAll() {
  await test("mail.your-server.de", 465, true);
  await test("mail.your-server.de", 587, false);
  await test("www712.your-server.de", 465, true);
  await test("www712.your-server.de", 587, false);
}

runAll();