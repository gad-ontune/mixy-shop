import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{9,20}$/;

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Enter your full name").max(120),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Enter a valid M-PESA phone number, e.g. 0712 345 678"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(160)
      .nullish()
      .or(z.literal("")),
    fulfilmentMethod: z.enum(["COLLECTION", "DELIVERY"]),
    deliveryAddress: z.string().trim().max(500).nullish().or(z.literal("")),
    deliveryNotes: z.string().trim().max(1000).nullish().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.fulfilmentMethod !== "DELIVERY" ||
      (data.deliveryAddress && data.deliveryAddress.length >= 8),
    {
      message: "Enter the delivery address (landmark, street and area).",
      path: ["deliveryAddress"],
    },
  );

export const retryPaymentSchema = z.object({
  orderId: z.string().min(5),
  accessToken: z.string().min(10),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid M-PESA phone number"),
});
