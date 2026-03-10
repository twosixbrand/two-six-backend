import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_SERVER_USER}>`,
      to: process.env.EMAIL_SERVER_USER,
      subject: "Test Email",
      text: "This is a test email.",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error:", error);
  }
}

testEmail();
