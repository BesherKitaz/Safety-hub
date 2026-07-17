import nodemailer from "nodemailer";
import { AppError } from "../controllers/userControllers"

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  EMAIL_FROM,
} = process.env;

if (
  !SMTP_HOST ||
  !SMTP_PORT ||
  !SMTP_USER ||
  !SMTP_PASSWORD ||
  !EMAIL_FROM
) {
  throw new Error("Email environment variables are not configured");
}

const smtpPort = Number(SMTP_PORT);

if (Number.isNaN(smtpPort)) {
  throw new Error("SMTP_PORT must be a valid number");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: smtpPort,
  secure: SMTP_SECURE === "true",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions) => {
  try {
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html: html ?? `<p>${text}</p>`,
    });
    return {
      messageId: result.messageId,
      previewUrl: nodemailer.getTestMessageUrl(result) || null,
    };
  } catch (error) {
    console.error("Failed to send email", error);
    throw new AppError(500, "EMAIL_SEND_FAILED", error instanceof Error ? error.message : "Failed to send email");
  }
};