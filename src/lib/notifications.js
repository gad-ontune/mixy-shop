import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Create an in-app notification and optionally log an email notification.
 * The platform stores notifications so they are visible to customers and staff
 * even when an email provider has not been configured.
 */
export async function notify({
  userId = null,
  orderId = null,
  type = "SYSTEM",
  title,
  message,
  email = null,
  sendEmail = true,
}) {
  try {
    await prisma.notification.create({
      data: { userId, orderId, type, title, message: String(message).slice(0, 2000) },
    });
  } catch (error) {
    console.error("[notifications] failed to store notification", error);
  }

  if (sendEmail && email) {
    await sendEmailNotification({ to: email, subject: title, text: message });
  }
}

export async function sendEmailNotification({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.info(`[notifications:email:not-configured] to=${to} subject=${subject}`);
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "MIX <no-reply@mix.co.ke>",
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (error) {
    console.error("[notifications] email delivery failed", error);
    return { sent: false, reason: error.message };
  }
}

export async function auditLog({ userId = null, action, entity, entityId = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata: metadata || undefined },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
