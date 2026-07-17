import nodemailer from "nodemailer";

const sendTestEmail = async () => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const result = await transporter.sendMail({
    from: '"SafetyHub" <noreply@safetyhub.test>',
    to: "student@example.com",
    subject: "SafetyHub test email",
    text: "This is the plain-text version of the email.",
    html: `
      <h1>SafetyHub</h1>
      <p>This is your first test email.</p>
    `,
  });

  console.log("Message ID:", result.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(result));
};

sendTestEmail().catch((error) => {
  console.error("Failed to send test email:", error);
  process.exitCode = 1;
});