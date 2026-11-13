import { z } from "zod";
import { REPAIR_DEVICE_TYPES } from "@/lib/constants";

const phoneRegex = /^\+?[0-9\s-]{9,20}$/;

export const repairRequestSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(160)
    .optional()
    .or(z.literal("")),
  deviceBrand: z.string().trim().min(2, "Enter the device brand").max(80),
  deviceModel: z.string().trim().min(1, "Enter the device model").max(120),
  deviceType: z.enum(REPAIR_DEVICE_TYPES),
  problemDescription: z
    .string()
    .trim()
    .min(15, "Describe the problem in at least 15 characters")
    .max(2000),
  preferredDate: z.string().trim().optional().or(z.literal("")),
  additionalInfo: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z
    .string()
    .optional()
    .refine((value) => value === "on", "Please accept the repair terms."),
});

export const repairUpdateSchema = z.object({
  repairId: z.string().min(5),
  status: z.enum([
    "SUBMITTED",
    "DIAGNOSING",
    "AWAITING_CUSTOMER_APPROVAL",
    "APPROVED",
    "IN_REPAIR",
    "READY_FOR_COLLECTION",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  diagnosis: z.string().trim().max(3000).optional().or(z.literal("")),
  estimateAmount: z.coerce.number().int().min(0).max(10000000).optional().or(z.nan()),
  assignedTechnicianId: z.string().trim().optional().or(z.literal("")),
  internalNotes: z.string().trim().max(3000).optional().or(z.literal("")),
});
