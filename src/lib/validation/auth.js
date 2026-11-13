import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{9,20}$/;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone number").max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.string().trim().email("Enter a valid email address").max(160),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Enter a valid phone number, e.g. 0712 345 678"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(200)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  addressLine: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter the email for your account").max(160),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(20),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(200)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
