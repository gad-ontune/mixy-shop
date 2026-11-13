import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{9,20}$/;

export const serviceRequestSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(160)
    .optional()
    .or(z.literal("")),
  serviceId: z.string().min(5, "Select a service"),
  instructions: z
    .string()
    .trim()
    .min(10, "Give us instructions for this request")
    .max(3000),
  pages: z.coerce.number().int().min(0).max(10000).optional().or(z.nan()),
  copies: z.coerce.number().int().min(0).max(1000).optional().or(z.nan()),
  outputFormat: z.string().trim().max(80).optional().or(z.literal("")),
  consent: z
    .string()
    .optional()
    .refine((value) => value === "on", "Please accept the document handling terms."),
});

export const serviceUpdateSchema = z.object({
  requestId: z.string().min(5),
  status: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "AWAITING_CUSTOMER_INFORMATION",
    "QUOTED",
    "APPROVED",
    "PROCESSING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  quoteAmount: z.coerce.number().int().min(0).max(10000000).optional().or(z.nan()),
  assignedToId: z.string().trim().optional().or(z.literal("")),
  internalNotes: z.string().trim().max(3000).optional().or(z.literal("")),
});
