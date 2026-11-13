"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { checkoutSchema, retryPaymentSchema } from "@/lib/validation/checkout";
import { generateReference, randomToken } from "@/lib/utils";
import { reserveStockForLines, InventoryError } from "@/lib/inventory";
import { startPaymentForOrder } from "@/lib/payments/process";
import { normalizeMsisdn } from "@/lib/payments/daraja";
import { formatKES } from "@/lib/format";
import { notify } from "@/lib/notifications";

export async function createOrderAction(prevState, formData) {
  const session = await auth();

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    fulfilmentMethod: formData.get("fulfilmentMethod"),
    deliveryAddress: formData.get("deliveryAddress"),
    deliveryNotes: formData.get("deliveryNotes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Check your delivery details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const settings = await getSettings();
  const { fulfilmentMethod } = parsed.data;

  if (fulfilmentMethod === "DELIVERY" && !settings.deliveryEnabled) {
    return { error: "Delivery is currently unavailable. Please choose shop collection." };
  }
  if (fulfilmentMethod === "COLLECTION" && !settings.collectionEnabled) {
    return { error: "Shop collection is currently unavailable. Please choose delivery." };
  }
  if (!settings.mpesaEnabled) {
    return {
      error:
        "Online M-PESA payment is temporarily unavailable. Please contact MIX to complete your order.",
    };
  }

  const cart = await getCart({ create: true });
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty. Add a product before checking out." };
  }

  const summary = summarizeCart(cart);
  if (summary.hasIssues) {
    return {
      error:
        "One or more items changed availability while you were shopping. Please review your cart.",
    };
  }

  const deliveryFee = fulfilmentMethod === "DELIVERY" ? settings.deliveryFee : 0;
  const total = summary.subtotal + deliveryFee;
  const phone = normalizeMsisdn(parsed.data.phone);

  if (total <= 0) return { error: "This order does not have a payable total." };

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          reference: generateReference("ORD"),
          accessToken: randomToken(24),
          userId: session?.user?.id || null,
          customerName: parsed.data.customerName,
          phone,
          email: parsed.data.email || null,
          fulfilmentMethod,
          deliveryAddress:
            fulfilmentMethod === "DELIVERY" ? parsed.data.deliveryAddress : null,
          deliveryNotes: parsed.data.deliveryNotes || null,
          subtotal: summary.subtotal,
          deliveryFee,
          total,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          items: {
            create: summary.items.map((item) => ({
              productId: item.product.id,
              variantId: item.variant?.id || null,
              productName: item.product.name,
              variantName: item.variant?.name || null,
              sku: item.variant?.sku || item.product.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
          history: {
            create: {
              status: "PENDING_PAYMENT",
              note: "Order created. Awaiting M-PESA payment.",
            },
          },
        },
      });

      await reserveStockForLines(
        tx,
        summary.items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id || null,
          productName: item.product.name,
          quantity: item.quantity,
        })),
        { reason: `Stock reserved for order ${created.reference}` },
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });
  } catch (error) {
    if (error instanceof InventoryError) {
      return { error: error.message };
    }
    console.error("[checkout] failed to create order", error);
    return { error: "We could not create your order. Please try again." };
  }

  await notify({
    userId: session?.user?.id || null,
    orderId: order.id,
    type: "ORDER_PLACED",
    title: `Order received — ${order.reference}`,
    message: `Thank you. We have received order ${order.reference} for ${formatKES(order.total)}. We will confirm it as soon as your M-PESA payment is verified.`,
    email: parsed.data.email || null,
  });

  const payment = await startPaymentForOrder({ order, phone });

  revalidatePath("/", "layout");
  redirect(
    `/checkout/confirmation?ref=${encodeURIComponent(order.reference)}&token=${order.accessToken}${payment?.simulated ? "&simulated=1" : ""}`,
  );
}

export async function retryOrderPaymentAction(prevState, formData) {
  const parsed = retryPaymentSchema.safeParse({
    orderId: formData.get("orderId"),
    accessToken: formData.get("accessToken"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your M-PESA number." };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true },
  });

  if (!order || order.accessToken !== parsed.data.accessToken) {
    return { error: "This order could not be found." };
  }
  if (order.paymentStatus === "SUCCESS") {
    return { error: "This order has already been paid." };
  }
  if (order.status === "CANCELLED") {
    return { error: "This order has been cancelled. Please start a new order." };
  }

  const settings = await getSettings();
  if (!settings.mpesaEnabled) {
    return { error: "Online M-PESA payment is temporarily unavailable." };
  }

  if (order.stockRestored) {
    try {
      await prisma.$transaction(async (tx) => {
        await reserveStockForLines(
          tx,
          order.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            quantity: item.quantity,
          })),
          { reason: `Stock re-reserved for order ${order.reference} retry` },
        );
        await tx.order.update({
          where: { id: order.id },
          data: {
            stockRestored: false,
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT",
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "PENDING_PAYMENT",
            note: "Customer retrying M-PESA payment.",
          },
        });
      });
    } catch (error) {
      if (error instanceof InventoryError) {
        return {
          error: `Some items are no longer available in the requested quantity. ${error.message}`,
        };
      }
      throw error;
    }
  }

  const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
  const result = await startPaymentForOrder({
    order: freshOrder,
    phone: parsed.data.phone,
  });

  revalidatePath("/account/orders");
  revalidatePath(`/checkout/confirmation`);

  redirect(
    `/checkout/confirmation?ref=${encodeURIComponent(order.reference)}&token=${order.accessToken}${result?.simulated ? "&simulated=1" : ""}`,
  );
}
