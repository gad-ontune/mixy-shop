"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { notify, auditLog } from "@/lib/notifications";
import { adjustInventory, restoreStockForOrder, InventoryError } from "@/lib/inventory";
import { markPaymentSuccess } from "@/lib/payments/process";
import { slugify } from "@/lib/utils";
import {
  productSchema,
  categorySchema,
  brandSchema,
  variantSchema,
  inventoryAdjustmentSchema,
  settingsSchema,
  announcementSchema,
  digitalServiceSchema,
  staffSchema,
  orderUpdateSchema,
} from "@/lib/validation/admin";

function withMessage(path, message, type = "error") {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${type}=${encodeURIComponent(message)}`;
}

function uniqueSlug(base, fallback) {
  const slug = slugify(base || "") || slugify(fallback || "") || "item";
  return slug;
}

async function ensureUniqueProductSlug(name, requested, productId) {
  const base = slugify(requested || name) || "product";
  let slug = base;
  let attempt = 1;
  // A short loop keeps generated slugs readable instead of random.
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === productId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

function parseSpecs(value) {
  if (!value) return null;
  const specs = {};
  for (const line of String(value).split("\n")) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim();
    const detail = rest.join(":").trim();
    if (key && detail) specs[key] = detail;
  }
  return Object.keys(specs).length > 0 ? specs : null;
}

function specsToText(specs) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return "";
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                          */
/* ------------------------------------------------------------------ */

export async function saveProductAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const productId = String(formData.get("productId") || "");
  const redirectTo = productId ? `/admin/products/${productId}` : "/admin/products/new";

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    brandId: formData.get("brandId"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockAt: formData.get("lowStockAt"),
    specs: formData.get("specs"),
    imageUrl: formData.get("imageUrl"),
    isFeatured: formData.get("isFeatured"),
    isNewArrival: formData.get("isNewArrival"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect(withMessage(redirectTo, parsed.error.issues[0]?.message || "Check the product."));
  }

  const data = parsed.data;
  const sku = data.sku.toUpperCase();
  const compareAtPrice = Number.isFinite(data.compareAtPrice) && data.compareAtPrice > 0
    ? data.compareAtPrice
    : null;

  const duplicateSku = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
  if (duplicateSku && duplicateSku.id !== productId) {
    redirect(withMessage(redirectTo, "That SKU is already used by another product."));
  }

  let savedId = productId;
  try {
    if (productId) {
      const existing = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });
      if (!existing) redirect(withMessage("/admin/products", "Product not found."));

      const slug = await ensureUniqueProductSlug(data.name, existing.slug, productId);
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: {
            name: data.name,
            slug,
            sku,
            categoryId: data.categoryId,
            brandId: data.brandId || null,
            description: data.description,
            price: data.price,
            compareAtPrice,
            lowStockAt: data.lowStockAt,
            specs: parseSpecs(data.specs) || undefined,
            isFeatured: data.isFeatured === "on",
            isNewArrival: data.isNewArrival === "on",
            isActive: data.isActive === "on",
          },
        });

        const imageUrl = data.imageUrl || "";
        if (imageUrl) {
          if (existing.images[0]) {
            await tx.productImage.update({
              where: { id: existing.images[0].id },
              data: { url: imageUrl },
            });
          } else {
            await tx.productImage.create({
              data: { productId, url: imageUrl, alt: data.name, sortOrder: 0 },
            });
          }
        }
      });
    } else {
      const slug = await ensureUniqueProductSlug(data.name, "", "");
      const created = await prisma.product.create({
        data: {
          name: data.name,
          slug,
          sku,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          description: data.description,
          price: data.price,
          compareAtPrice,
          stockQuantity: data.stockQuantity,
          lowStockAt: data.lowStockAt,
          specs: parseSpecs(data.specs) || undefined,
          isFeatured: data.isFeatured === "on",
          isNewArrival: data.isNewArrival === "on",
          isActive: data.isActive === "on",
          images: data.imageUrl
            ? { create: [{ url: data.imageUrl, alt: data.name, sortOrder: 0 }] }
            : undefined,
        },
      });
      savedId = created.id;

      if (data.stockQuantity > 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: created.id,
            userId: user.id,
            quantityChange: data.stockQuantity,
            previousQuantity: 0,
            newQuantity: data.stockQuantity,
            reason: "Opening stock",
          },
        });
      }
    }
  } catch (error) {
    console.error("[admin] save product failed", error);
    redirect(withMessage(redirectTo, "We could not save the product. Check the details and try again."));
  }

  await auditLog({
    userId: user.id,
    action: productId ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
    entity: "Product",
    entityId: savedId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/store");
  revalidatePath("/");
  redirect(withMessage("/admin/products", "Product saved.", "ok"));
}

export async function toggleProductActiveAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const productId = String(formData.get("productId") || "");
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) redirect(withMessage("/admin/products", "Product not found."));

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });
  await auditLog({
    userId: user.id,
    action: product.isActive ? "PRODUCT_DEACTIVATED" : "PRODUCT_ACTIVATED",
    entity: "Product",
    entityId: productId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/store");
  redirect(withMessage("/admin/products", product.isActive ? "Product hidden from the store." : "Product is now live.", "ok"));
}

export async function saveVariantAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const parsed = variantSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    stockQuantity: formData.get("stockQuantity"),
    isActive: formData.get("isActive"),
  });
  const productId = String(formData.get("productId") || "");
  if (!parsed.success) {
    redirect(withMessage(`/admin/products/${productId}`, parsed.error.issues[0]?.message || "Check the variant."));
  }

  const variantId = String(formData.get("variantId") || "");
  const sku = parsed.data.sku.toUpperCase();
  const price = Number.isFinite(parsed.data.price) && parsed.data.price > 0 ? parsed.data.price : null;

  const duplicate = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } });
  if (duplicate && duplicate.id !== variantId) {
    redirect(withMessage(`/admin/products/${productId}`, "That variant SKU is already in use."));
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (variantId) {
        const existing = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (!existing || existing.productId !== productId) {
          throw new Error("Variant not found.");
        }
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            name: parsed.data.name,
            sku,
            price,
            stockQuantity: parsed.data.stockQuantity,
            isActive: parsed.data.isActive === "on",
          },
        });
        if (existing.stockQuantity !== parsed.data.stockQuantity) {
          await tx.inventoryMovement.create({
            data: {
              productId,
              variantId,
              userId: user.id,
              quantityChange: parsed.data.stockQuantity - existing.stockQuantity,
              previousQuantity: existing.stockQuantity,
              newQuantity: parsed.data.stockQuantity,
              reason: "Variant stock updated",
            },
          });
        }
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            name: parsed.data.name,
            sku,
            price,
            stockQuantity: parsed.data.stockQuantity,
            isActive: parsed.data.isActive === "on",
          },
        });
        if (parsed.data.stockQuantity > 0) {
          await tx.inventoryMovement.create({
            data: {
              productId,
              userId: user.id,
              quantityChange: parsed.data.stockQuantity,
              previousQuantity: 0,
              newQuantity: parsed.data.stockQuantity,
              reason: `Opening stock for ${parsed.data.name}`,
            },
          });
        }
      }

      const aggregate = await tx.productVariant.aggregate({
        where: { productId, isActive: true },
        _sum: { stockQuantity: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: aggregate._sum.stockQuantity || 0 },
      });
    });
  } catch (error) {
    console.error("[admin] save variant failed", error);
    redirect(withMessage(`/admin/products/${productId}`, "We could not save the variant."));
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/store");
  redirect(withMessage(`/admin/products/${productId}`, "Variant saved.", "ok"));
}

export async function deleteVariantAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const variantId = String(formData.get("variantId") || "");
  const productId = String(formData.get("productId") || "");

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    redirect(withMessage(`/admin/products/${productId}`, "Variant not found."));
  }

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.delete({ where: { id: variantId } });
    const aggregate = await tx.productVariant.aggregate({
      where: { productId, isActive: true },
      _sum: { stockQuantity: true },
    });
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: aggregate._sum.stockQuantity || 0 },
    });
  });

  await auditLog({
    userId: user.id,
    action: "VARIANT_DELETED",
    entity: "ProductVariant",
    entityId: variantId,
  });
  revalidatePath(`/admin/products/${productId}`);
  redirect(withMessage(`/admin/products/${productId}`, "Variant removed.", "ok"));
}

export async function saveCategoryAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const categoryId = String(formData.get("categoryId") || "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/categories", parsed.error.issues[0]?.message || "Check the category."));
  }

  const slug = uniqueSlug(parsed.data.slug || parsed.data.name, parsed.data.name);
  const duplicate = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate && duplicate.id !== categoryId) {
    redirect(withMessage("/admin/categories", "That category slug is already used."));
  }

  try {
    if (categoryId) {
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          imageUrl: parsed.data.imageUrl || null,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive === "on",
        },
      });
    } else {
      await prisma.category.create({
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          imageUrl: parsed.data.imageUrl || null,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive === "on",
        },
      });
    }
  } catch (error) {
    console.error("[admin] save category failed", error);
    redirect(withMessage("/admin/categories", "We could not save the category."));
  }

  await auditLog({
    userId: user.id,
    action: categoryId ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
    entity: "Category",
    entityId: categoryId || null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/store");
  redirect(withMessage("/admin/categories", "Category saved.", "ok"));
}

export async function deleteCategoryAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const categoryId = String(formData.get("categoryId") || "");
  const products = await prisma.product.count({ where: { categoryId } });
  if (products > 0) {
    redirect(withMessage("/admin/categories", "Move or remove the products in this category first."));
  }

  await prisma.category.delete({ where: { id: categoryId } });
  await auditLog({ userId: user.id, action: "CATEGORY_DELETED", entity: "Category", entityId: categoryId });
  revalidatePath("/admin/categories");
  redirect(withMessage("/admin/categories", "Category deleted.", "ok"));
}

export async function saveBrandAction(formData) {
  const user = await assertPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const brandId = String(formData.get("brandId") || "");
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    redirect(withMessage("/admin/categories", parsed.error.issues[0]?.message || "Check the brand."));
  }

  try {
    if (brandId) {
      await prisma.brand.update({
        where: { id: brandId },
        data: { name: parsed.data.name, logoUrl: parsed.data.logoUrl || null },
      });
    } else {
      await prisma.brand.create({
        data: {
          name: parsed.data.name,
          slug: uniqueSlug(parsed.data.name, parsed.data.name),
          logoUrl: parsed.data.logoUrl || null,
        },
      });
    }
  } catch (error) {
    console.error("[admin] save brand failed", error);
    redirect(withMessage("/admin/categories", "That brand may already exist."));
  }

  await auditLog({ userId: user.id, action: "BRAND_SAVED", entity: "Brand", entityId: brandId || null });
  revalidatePath("/admin/categories");
  redirect(withMessage("/admin/categories", "Brand saved.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Inventory                                                          */
/* ------------------------------------------------------------------ */

export async function adjustStockAction(formData) {
  const user = await assertPermission(PERMISSIONS.INVENTORY_MANAGE);
  const parsed = inventoryAdjustmentSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
    quantityChange: formData.get("quantityChange"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/inventory", parsed.error.issues[0]?.message || "Check the adjustment."));
  }

  try {
    await prisma.$transaction(async (tx) => {
      await adjustInventory(tx, {
        productId: parsed.data.productId,
        variantId: parsed.data.variantId || null,
        quantityChange: parsed.data.quantityChange,
        reason: parsed.data.reason,
        userId: user.id,
      });
    });
  } catch (error) {
    const message = error instanceof InventoryError ? error.message : "We could not adjust stock.";
    redirect(withMessage("/admin/inventory", message));
  }

  await auditLog({
    userId: user.id,
    action: "INVENTORY_ADJUSTED",
    entity: "Product",
    entityId: parsed.data.productId,
    metadata: {
      variantId: parsed.data.variantId || null,
      quantityChange: parsed.data.quantityChange,
      reason: parsed.data.reason,
    },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  redirect(withMessage("/admin/inventory", "Stock adjusted.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Orders and payments                                                */
/* ------------------------------------------------------------------ */

export async function updateOrderAction(formData) {
  const user = await assertPermission(PERMISSIONS.ORDERS_MANAGE);
  const parsed = orderUpdateSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
    adminNotes: formData.get("adminNotes"),
  });

  const orderId = String(formData.get("orderId") || "");
  if (!parsed.success) {
    redirect(withMessage(`/admin/orders/${formData.get("reference") || ""}`, parsed.error.issues[0]?.message || "Check the update."));
  }

  let order = null;
  try {
    order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!current) throw new Error("Order not found.");

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes || null,
        },
      });

      if (current.status !== parsed.data.status || parsed.data.note) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: parsed.data.status,
            note: parsed.data.note || `Status changed to ${parsed.data.status}.`,
            changedById: user.id,
          },
        });
      }

      if (parsed.data.status === "CANCELLED" && !current.stockRestored) {
        await restoreStockForOrder(tx, orderId, {
          reason: `Order ${current.reference} cancelled`,
          userId: user.id,
        });
      }

      return updated;
    });
  } catch (error) {
    console.error("[admin] update order failed", error);
    redirect(withMessage(`/admin/orders/${formData.get("reference") || ""}`, error.message || "We could not update the order."));
  }

  await notify({
    userId: order.userId,
    orderId: order.id,
    type: "ORDER_STATUS",
    title: `Order ${order.reference} updated`,
    message: parsed.data.note
      ? `Your order ${order.reference} is now ${parsed.data.status.replaceAll("_", " ").toLowerCase()}. ${parsed.data.note}`
      : `Your order ${order.reference} is now ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
    email: order.email,
  });

  await auditLog({
    userId: user.id,
    action: "ORDER_STATUS_UPDATED",
    entity: "Order",
    entityId: order.reference,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.reference}`);
  revalidatePath("/account/orders");
  redirect(withMessage(`/admin/orders/${order.reference}`, "Order updated.", "ok"));
}

export async function reconcilePaymentAction(formData) {
  const user = await assertPermission(PERMISSIONS.PAYMENTS_MANAGE);
  const paymentId = String(formData.get("paymentId") || "");
  const receipt = String(formData.get("receipt") || "").trim().toUpperCase();
  const note = String(formData.get("note") || "").trim();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { reference: true } } },
  });
  if (!payment) redirect(withMessage("/admin/payments", "Payment not found."));

  if (!receipt || receipt.length < 6) {
    redirect(withMessage(`/admin/orders/${payment.order.reference}`, "Enter the M-PESA receipt to reconcile this payment."));
  }

  try {
    await markPaymentSuccess(paymentId, {
      receipt,
      amount: payment.amount,
      resultCode: "0",
      resultDesc: note ? `Manually reconciled: ${note}` : "Manually reconciled by staff",
      raw: { source: "admin-reconciliation", reconciledBy: user.id, note },
    });
  } catch (error) {
    console.error("[admin] reconcile payment failed", error);
    redirect(withMessage(`/admin/orders/${payment.order.reference}`, error.message || "We could not reconcile this payment."));
  }

  await auditLog({
    userId: user.id,
    action: "PAYMENT_RECONCILED",
    entity: "Payment",
    entityId: paymentId,
    metadata: { receipt },
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${payment.order.reference}`);
  redirect(withMessage(`/admin/orders/${payment.order.reference}`, "Payment reconciled.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Repairs                                                            */
/* ------------------------------------------------------------------ */

export async function updateRepairAction(formData) {
  const user = await assertPermission(PERMISSIONS.REPAIRS_MANAGE);
  const repairId = String(formData.get("repairId") || "");
  const reference = String(formData.get("reference") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  const diagnosis = String(formData.get("diagnosis") || "").trim();
  const estimateRaw = String(formData.get("estimateAmount") || "").trim();
  const internalNotes = String(formData.get("internalNotes") || "").trim();
  const technicianId = String(formData.get("technicianId") || "");

  const allowed = [
    "SUBMITTED",
    "DIAGNOSING",
    "AWAITING_CUSTOMER_APPROVAL",
    "APPROVED",
    "IN_REPAIR",
    "READY_FOR_COLLECTION",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!allowed.includes(status)) {
    redirect(withMessage(`/admin/repairs/${reference}`, "Choose a valid repair status."));
  }

  const estimateAmount = estimateRaw === "" ? null : Number.parseInt(estimateRaw, 10);
  if (estimateAmount != null && (!Number.isInteger(estimateAmount) || estimateAmount < 0)) {
    redirect(withMessage(`/admin/repairs/${reference}`, "Enter a valid estimate amount."));
  }

  let repair = null;
  try {
    repair = await prisma.$transaction(async (tx) => {
      const current = await tx.repairRequest.findUnique({ where: { id: repairId } });
      if (!current) throw new Error("Repair not found.");

      const updated = await tx.repairRequest.update({
        where: { id: repairId },
        data: {
          status,
          diagnosis: diagnosis || current.diagnosis,
          estimateAmount,
          internalNotes: internalNotes || null,
          assignedTechnicianId: technicianId || null,
        },
      });

      if (current.status !== status || note) {
        await tx.repairStatusHistory.create({
          data: {
            repairId,
            status,
            note: note || `Repair status changed to ${status.replaceAll("_", " ").toLowerCase()}.`,
            changedById: user.id,
          },
        });
      }

      if (diagnosis && diagnosis !== current.diagnosis) {
        await tx.repairDiagnosis.create({
          data: {
            repairId,
            technicianId: technicianId || user.id,
            findings: diagnosis,
            estimateAmount,
          },
        });
      }

      if (technicianId && technicianId !== current.assignedTechnicianId) {
        await tx.technicianAssignment.updateMany({
          where: { repairId, active: true },
          data: { active: false },
        });
        await tx.technicianAssignment.create({
          data: { repairId, technicianId, active: true },
        });
      }

      return updated;
    });
  } catch (error) {
    console.error("[admin] update repair failed", error);
    redirect(withMessage(`/admin/repairs/${reference}`, error.message || "We could not update the repair."));
  }

  await notify({
    userId: repair.userId,
    type: "REPAIR_STATUS",
    title: `Repair ${repair.reference} updated`,
    message: note
      ? `Your repair ${repair.reference} is now ${status.replaceAll("_", " ").toLowerCase()}. ${note}`
      : `Your repair ${repair.reference} is now ${status.replaceAll("_", " ").toLowerCase()}.`,
    email: repair.email,
  });

  await auditLog({
    userId: user.id,
    action: "REPAIR_UPDATED",
    entity: "RepairRequest",
    entityId: repair.reference,
    metadata: { status },
  });

  revalidatePath("/admin/repairs");
  revalidatePath(`/admin/repairs/${repair.reference}`);
  revalidatePath("/account/repairs");
  redirect(withMessage(`/admin/repairs/${repair.reference}`, "Repair updated.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Digital services                                                   */
/* ------------------------------------------------------------------ */

export async function saveDigitalServiceAction(formData) {
  const user = await assertPermission(PERMISSIONS.SERVICES_MANAGE);
  const serviceId = String(formData.get("serviceId") || "");
  const parsed = digitalServiceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceFrom: formData.get("priceFrom"),
    unit: formData.get("unit"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/services", parsed.error.issues[0]?.message || "Check the service."));
  }

  const priceFrom = Number.isFinite(parsed.data.priceFrom) && parsed.data.priceFrom > 0
    ? parsed.data.priceFrom
    : null;

  try {
    if (serviceId) {
      await prisma.digitalService.update({
        where: { id: serviceId },
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          priceFrom,
          unit: parsed.data.unit || "service",
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive === "on",
        },
      });
    } else {
      const base = slugify(parsed.data.name) || "service";
      let slug = base;
      let attempt = 1;
      for (;;) {
        const existing = await prisma.digitalService.findUnique({ where: { slug }, select: { id: true } });
        if (!existing) break;
        attempt += 1;
        slug = `${base}-${attempt}`;
      }
      await prisma.digitalService.create({
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          priceFrom,
          unit: parsed.data.unit || "service",
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive === "on",
        },
      });
    }
  } catch (error) {
    console.error("[admin] save service failed", error);
    redirect(withMessage("/admin/services", "We could not save the service."));
  }

  await auditLog({ userId: user.id, action: "DIGITAL_SERVICE_SAVED", entity: "DigitalService", entityId: serviceId || null });
  revalidatePath("/admin/services");
  revalidatePath("/digital-services");
  redirect(withMessage("/admin/services", "Service saved.", "ok"));
}

export async function deleteDigitalServiceAction(formData) {
  const user = await assertPermission(PERMISSIONS.SERVICES_MANAGE);
  const serviceId = String(formData.get("serviceId") || "");
  const requests = await prisma.serviceRequest.count({ where: { serviceId } });
  if (requests > 0) {
    redirect(withMessage("/admin/services", "This service has requests. Deactivate it instead of deleting."));
  }

  await prisma.digitalService.delete({ where: { id: serviceId } });
  await auditLog({ userId: user.id, action: "DIGITAL_SERVICE_DELETED", entity: "DigitalService", entityId: serviceId });
  revalidatePath("/admin/services");
  redirect(withMessage("/admin/services", "Service deleted.", "ok"));
}

export async function updateServiceRequestAction(formData) {
  const user = await assertPermission(PERMISSIONS.SERVICES_MANAGE);
  const requestId = String(formData.get("requestId") || "");
  const reference = String(formData.get("reference") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  const quoteRaw = String(formData.get("quoteAmount") || "").trim();
  const internalNotes = String(formData.get("internalNotes") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "");

  const allowed = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "AWAITING_CUSTOMER_INFORMATION",
    "QUOTED",
    "APPROVED",
    "PROCESSING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!allowed.includes(status)) {
    redirect(withMessage(`/admin/services/requests/${reference}`, "Choose a valid request status."));
  }

  const quoteAmount = quoteRaw === "" ? null : Number.parseInt(quoteRaw, 10);
  if (quoteAmount != null && (!Number.isInteger(quoteAmount) || quoteAmount < 0)) {
    redirect(withMessage(`/admin/services/requests/${reference}`, "Enter a valid quote amount."));
  }

  let request = null;
  try {
    request = await prisma.$transaction(async (tx) => {
      const current = await tx.serviceRequest.findUnique({ where: { id: requestId } });
      if (!current) throw new Error("Request not found.");

      const updated = await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status,
          quoteAmount,
          internalNotes: internalNotes || null,
          assignedToId: assigneeId || null,
        },
      });

      if (current.status !== status || note) {
        await tx.serviceRequestStatusHistory.create({
          data: {
            requestId,
            status,
            note: note || `Request status changed to ${status.replaceAll("_", " ").toLowerCase()}.`,
            changedById: user.id,
          },
        });
      }

      return updated;
    });
  } catch (error) {
    console.error("[admin] update service request failed", error);
    redirect(withMessage(`/admin/services/requests/${reference}`, error.message || "We could not update the request."));
  }

  await notify({
    userId: request.userId,
    type: "SERVICE_REQUEST",
    title: `Request ${request.reference} updated`,
    message: note
      ? `Your service request ${request.reference} is now ${status.replaceAll("_", " ").toLowerCase()}. ${note}`
      : `Your service request ${request.reference} is now ${status.replaceAll("_", " ").toLowerCase()}.`,
    email: request.email,
  });

  await auditLog({
    userId: user.id,
    action: "SERVICE_REQUEST_UPDATED",
    entity: "ServiceRequest",
    entityId: request.reference,
    metadata: { status },
  });

  revalidatePath("/admin/services/requests");
  revalidatePath(`/admin/services/requests/${request.reference}`);
  revalidatePath("/account/requests");
  redirect(withMessage(`/admin/services/requests/${request.reference}`, "Request updated.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Staff                                                              */
/* ------------------------------------------------------------------ */

export async function saveStaffAction(formData) {
  const user = await assertPermission(PERMISSIONS.STAFF_MANAGE);
  const staffId = String(formData.get("staffId") || "");
  const submittedPassword = String(formData.get("password") || "");
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    // Existing accounts can be edited without setting a new password.
    password: staffId && !submittedPassword ? "unchanged-password" : submittedPassword,
    position: formData.get("position"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/staff", parsed.error.issues[0]?.message || "Check the staff details."));
  }

  const email = parsed.data.email.toLowerCase();
  const phone = parsed.data.phone ? parsed.data.phone.replace(/[\s-]/g, "") : null;
  const role = await prisma.role.findUnique({ where: { name: parsed.data.role } });
  if (!role) redirect(withMessage("/admin/staff", "That role is not configured."));

  const duplicate = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
      ...(staffId ? { NOT: { id: staffId } } : {}),
    },
    select: { id: true, email: true },
  });
  if (duplicate) {
    redirect(withMessage("/admin/staff", `An account already uses ${duplicate.email || "that phone number"}.`));
  }

  try {
    if (staffId) {
      const passwordHash = submittedPassword
        ? await bcrypt.hash(submittedPassword, 12)
        : undefined;
      await prisma.user.update({
        where: { id: staffId },
        data: {
          name: parsed.data.name,
          email,
          phone,
          roleId: role.id,
          ...(passwordHash ? { passwordHash } : {}),
          staffProfile: {
            upsert: {
              create: { position: parsed.data.position || null },
              update: { position: parsed.data.position || null },
            },
          },
        },
      });
    } else {
      const passwordHash = await bcrypt.hash(submittedPassword, 12);
      await prisma.user.create({
        data: {
          name: parsed.data.name,
          email,
          phone,
          passwordHash,
          roleId: role.id,
          staffProfile: { create: { position: parsed.data.position || null } },
        },
      });
    }
  } catch (error) {
    console.error("[admin] save staff failed", error);
    redirect(withMessage("/admin/staff", "We could not save the staff account."));
  }

  await auditLog({
    userId: user.id,
    action: staffId ? "STAFF_UPDATED" : "STAFF_CREATED",
    entity: "User",
    entityId: staffId || null,
    metadata: { role: parsed.data.role },
  });
  revalidatePath("/admin/staff");
  redirect(withMessage("/admin/staff", "Staff account saved.", "ok"));
}

export async function toggleStaffActiveAction(formData) {
  const user = await assertPermission(PERMISSIONS.STAFF_MANAGE);
  const staffId = String(formData.get("staffId") || "");
  if (staffId === user.id) {
    redirect(withMessage("/admin/staff", "You cannot deactivate your own account."));
  }

  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  if (!staff) redirect(withMessage("/admin/staff", "Staff account not found."));

  await prisma.user.update({ where: { id: staffId }, data: { isActive: !staff.isActive } });
  await auditLog({
    userId: user.id,
    action: staff.isActive ? "STAFF_DEACTIVATED" : "STAFF_ACTIVATED",
    entity: "User",
    entityId: staffId,
  });
  revalidatePath("/admin/staff");
  redirect(withMessage("/admin/staff", staff.isActive ? "Staff account deactivated." : "Staff account activated.", "ok"));
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(formData) {
  const user = await assertPermission(PERMISSIONS.SETTINGS_MANAGE);
  const parsed = settingsSchema.safeParse({
    businessName: formData.get("businessName"),
    tagline: formData.get("tagline"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    address: formData.get("address"),
    openingHours: formData.get("openingHours"),
    deliveryEnabled: formData.get("deliveryEnabled"),
    collectionEnabled: formData.get("collectionEnabled"),
    deliveryFee: formData.get("deliveryFee"),
    deliveryCoverage: formData.get("deliveryCoverage"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    mpesaEnabled: formData.get("mpesaEnabled"),
  });

  if (!parsed.success) {
    redirect(withMessage("/admin/settings", parsed.error.issues[0]?.message || "Check the settings."));
  }

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {
      businessName: parsed.data.businessName,
      tagline: parsed.data.tagline || "",
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      address: parsed.data.address,
      openingHours: parsed.data.openingHours,
      deliveryEnabled: parsed.data.deliveryEnabled === "on",
      collectionEnabled: parsed.data.collectionEnabled === "on",
      deliveryFee: parsed.data.deliveryFee,
      deliveryCoverage: parsed.data.deliveryCoverage || null,
      lowStockThreshold: parsed.data.lowStockThreshold,
      mpesaEnabled: parsed.data.mpesaEnabled === "on",
    },
    create: {
      id: "singleton",
      businessName: parsed.data.businessName,
      tagline: parsed.data.tagline || "",
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      address: parsed.data.address,
      openingHours: parsed.data.openingHours,
      deliveryEnabled: parsed.data.deliveryEnabled === "on",
      collectionEnabled: parsed.data.collectionEnabled === "on",
      deliveryFee: parsed.data.deliveryFee,
      deliveryCoverage: parsed.data.deliveryCoverage || null,
      lowStockThreshold: parsed.data.lowStockThreshold,
      mpesaEnabled: parsed.data.mpesaEnabled === "on",
    },
  });

  await auditLog({ userId: user.id, action: "SETTINGS_UPDATED", entity: "BusinessSettings", entityId: "singleton" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/store");
  redirect(withMessage("/admin/settings", "Settings saved.", "ok"));
}

export async function saveAnnouncementAction(formData) {
  const user = await assertPermission(PERMISSIONS.SETTINGS_MANAGE);
  const parsed = announcementSchema.safeParse({
    message: formData.get("message"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    redirect(withMessage("/admin/settings", parsed.error.issues[0]?.message || "Check the announcement."));
  }

  await prisma.announcement.create({
    data: { message: parsed.data.message, isActive: parsed.data.isActive === "on" },
  });
  await auditLog({ userId: user.id, action: "ANNOUNCEMENT_CREATED", entity: "Announcement" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(withMessage("/admin/settings", "Announcement saved.", "ok"));
}

export async function toggleAnnouncementAction(formData) {
  await assertPermission(PERMISSIONS.SETTINGS_MANAGE);
  const announcementId = String(formData.get("announcementId") || "");
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) redirect(withMessage("/admin/settings", "Announcement not found."));

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isActive: !announcement.isActive },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(withMessage("/admin/settings", "Announcement updated.", "ok"));
}
