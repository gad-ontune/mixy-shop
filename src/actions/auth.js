"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import {
  loginSchema,
  registerSchema,
  profileSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/utils";
import { sendEmailNotification } from "@/lib/notifications";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticate(prevState, formData) {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details and try again." };
  }

  const callbackUrl = safeRedirectPath(formData.get("callbackUrl"), "/account");

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email/phone or password. Please try again." };
      }
      return { error: "We could not sign you in. Please try again." };
    }
    throw error;
  }

  return { ok: true };
}

export async function registerAction(prevState, formData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details and try again." };
  }

  const email = parsed.data.email.toLowerCase();
  const phone = parsed.data.phone.replace(/[\s-]/g, "");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true },
  });

  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with this email already exists. Try signing in."
          : "An account with this phone number already exists. Try signing in.",
    };
  }

  const role = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (!role) {
    return { error: "Customer accounts are not available right now. Please contact MIX." };
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: role.id,
        customerProfile: {
          create: { defaultPhone: phone },
        },
      },
    });
  } catch {
    return { error: "We could not create your account. Please try again." };
  }

  try {
    await signIn("credentials", {
      identifier: email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in to continue." };
    }
    throw error;
  }

  return { ok: true };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordResetAction(prevState, formData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Enter your email address." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmailNotification({
      to: email,
      subject: "Reset your MIX password",
      text: `Someone requested a password reset for your MIX account. If this was you, use this link within one hour: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    });

    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      console.info(`[password-reset] ${resetUrl}`);
      return {
        ok: true,
        message: "Reset link generated. Since email is not configured in development, use the link below.",
        devLink: resetUrl,
      };
    }
  }

  return {
    ok: true,
    message:
      "If an account exists with that email, we have sent a password reset link. Check your inbox and spam folder.",
  };
}

export async function resetPasswordAction(prevState, formData) {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your password and try again." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, NOT: { id: record.id } },
    }),
  ]);

  return { ok: true, message: "Your password has been updated. You can now sign in." };
}

export async function updateProfileAction(prevState, formData) {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to update your profile." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details." };
  }

  const phone = parsed.data.phone ? parsed.data.phone.replace(/[\s-]/g, "") : null;

  if (phone) {
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: user.id } },
      select: { id: true },
    });
    if (existing) return { error: "That phone number is used by another account." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone,
      customerProfile: {
        upsert: {
          create: {
            defaultPhone: phone,
            addressLine: parsed.data.addressLine || null,
            city: parsed.data.city || null,
          },
          update: {
            defaultPhone: phone,
            addressLine: parsed.data.addressLine || null,
            city: parsed.data.city || null,
          },
        },
      },
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated." };
}

export async function markNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in." };
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/account");
  return { ok: true };
}
