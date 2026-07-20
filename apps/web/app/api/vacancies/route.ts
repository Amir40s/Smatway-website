import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const cvFile = formData.get("cv") as File | null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Prepare attachments
    const attachments: any[] = [];
    if (cvFile && cvFile.name) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      attachments.push({
        filename: cvFile.name,
        content: buffer,
        contentType: cvFile.type,
      });
    }

    // Configure the SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.your-server.de",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "noreply@smatway.com",
        pass: process.env.SMTP_PASS || ".Benjamino1.",
      },
    });

    const mailOptions = {
      from: `"SmatWay Careers" <${process.env.SMTP_USER || "noreply@smatway.com"}>`,
      replyTo: email,
      to: "careers@smatway.com", // Updated to the correct spelling (careers)
      subject: `New Application: ${subject || "Employment Inquiry"}`,
      text: `
You have received a new application from the SmatWay website.

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Application submitted successfully." });
  } catch (error: any) {
    console.error("Error sending application email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application. Please try again later." },
      { status: 500 }
    );
  }
}
