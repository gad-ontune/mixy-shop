import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{9,20}$/;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter the product name").max(160),
  sku: z.string().trim().min(2, "Enter a SKU").max(60),
  categoryId: z.string().min(5, "Select a category"),
  brandId: z.string().optional().or(z.literal("")),
  description: z.string().trim().min(20, "Add a description of at least 20 characters").max(6000),
  price: z.coerce.number().int().min(0).max(100000000),
  compareAtPrice: z.coerce.number().int().min(0).max(100000000).optional().or(z.nan()),
  stockQuantity: z.coerce.number().int().min(0).max(1000000),
  lowStockAt: z.coerce.number().int().min(0).max(1000),
  specs: z.string().trim().max(3000).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isFeatured: z.string().optional(),
  isNewArrival: z.string().optional(),
  isActive: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter the category name").max(80),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.string().optional(),
});

export const brandSchema = z.object({
  name: z.string().trim().min(2, "Enter the brand name").max(80),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const variantSchema = z.object({
  productId: z.string().min(5),
  name: z.string().trim().min(1, "Enter a variant name").max(120),
  sku: z.string().trim().min(2, "Enter a variant SKU").max(60),
  price: z.coerce.number().int().min(0).max(100000000).optional().or(z.nan()),
  stockQuantity: z.coerce.number().int().min(0).max(1000000),
  isActive: z.string().optional(),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(5),
  variantId: z.string().optional().or(z.literal("")),
  quantityChange: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "Quantity change cannot be zero"),
  reason: z.string().trim().min(3, "Record a reason for the adjustment").max(300),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  whatsapp: z.string().trim().regex(/^[0-9]{9,15}$/, "Use digits only, e.g. 254712345678"),
  email: z.string().trim().email("Enter a valid email"),
  address: z.string().trim().min(5).max(300),
  openingHours: z.string().trim().min(3).max(200),
  deliveryEnabled: z.string().optional(),
  collectionEnabled: z.string().optional(),
  deliveryFee: z.coerce.number().int().min(0).max(100000),
  deliveryCoverage: z.string().trim().max(300).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
  mpesaEnabled: z.string().optional(),
});

export const announcementSchema = z.object({
  message: z.string().trim().min(3, "Enter an announcement message").max(240),
  isActive: z.string().optional(),
});

export const digitalServiceSchema = z.object({
  name: z.string().trim().min(2, "Enter the service name").max(120),
  description: z.string().trim().min(10, "Add a description").max(2000),
  priceFrom: z.coerce.number().int().min(0).max(10000000).optional().or(z.nan()),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.string().optional(),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Enter the staff member's name").max(120),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF", "TECHNICIAN"]),
  password: z.string().min(8, "Use at least 8 characters").max(200),
  position: z.string().trim().max(120).optional().or(z.literal("")),
});

export const orderUpdateSchema = z.object({
  orderId: z.string().min(5),
  status: z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_FAILED",
    "CONFIRMED",
    "PROCESSING",
    "READY_FOR_COLLECTION",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});
