import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import { restoreStockForOrder } from "@/lib/inventory";
import { initiateStkPush, isDarajaConfigured, normalizeMsisdn } from "@/lib/payments/daraja";
import { formatKES } from "@/lib/format";

function simulationEnabled() {
  return (
    process.env.PAYMENTS_SIMULATION === "true" && process.env.NODE_ENV !== "production"
  );
}

export function paymentMode() {
  if (simulationEnabled()) return "simulation";
  if (isDarajaConfigured()) return "daraja";
  return "unavailable";
}

/**
 * Create a payment attempt for an order and initiate STK push (or simulate in
 * development). The order is never marked paid merely because a push started.
 */
export async function startPaymentForOrder({ order, phone }) {
  const msisdn = normalizeMsisdn(phone || order.phone);

  const payment = await prisma.payment.create({
    data: {
      reference: generateReference("PAY"),
      orderId: order.id,
      amount: order.total,
      phone: msisdn,
      status: "PENDING",
      method: "MPESA",
    },
  });

  if (simulationEnabled()) {
    const receipt = `SIM${randomBytes(4).toString("hex").toUpperCase()}`;
    await markPaymentSuccess(payment.id, {
      receipt,
      amount: order.total,
      resultCode: "0",
      resultDesc: "Simulated M-PESA payment (development mode)",
      raw: { simulated: true, receipt },
    });
    return { ok: true, simulated: true, paymentId: payment.id };
  }

  if (!isDarajaConfigured()) {
    await markPaymentFailed(payment.id, {
      reason:
        "M-PESA is not configured yet. Please contact MIX support or try again later.",
      resultCode: "CONFIG",
    });
    return { ok: false, error: "M-PESA is not configured on this server.", paymentId: payment.id };
  }

  try {
    const response = await initiateStkPush({
      phone: msisdn,
      amount: order.total,
      accountReference: order.reference,
      description: `MIX ${order.reference}`,
    });

    if (response.ResponseCode && response.ResponseCode !== "0") {
      throw new Error(response.ResponseDescription || "M-PESA rejected the request.");
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        merchantRequestId: response.MerchantRequestID || null,
        checkoutRequestId: response.CheckoutRequestID || null,
        resultCode: response.ResponseCode || null,
        resultDesc: response.ResponseDescription || null,
      },
    });

    return {
      ok: true,
      simulated: false,
      paymentId: payment.id,
      checkoutRequestId: response.CheckoutRequestID,
    };
  } catch (error) {
    await markPaymentFailed(payment.id, {
      reason: error.message || "Could not initiate M-PESA payment.",
      resultCode: "INIT_FAILED",
    });
    return { ok: false, error: error.message, paymentId: payment.id };
  }
}

export async function markPaymentSuccess(paymentId, { receipt, amount, resultCode, resultDesc, raw }) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment not found.");
    if (payment.status === "SUCCESS") {
      return { alreadyProcessed: true, order: payment.order, payment };
    }
    if (amount != null && Number(amount) < payment.amount) {
      throw new Error("Callback amount does not match the order total.");
    }
    if (receipt) {
      const duplicate = await tx.payment.findFirst({
        where: { mpesaReceipt: receipt, NOT: { id: payment.id } },
        select: { id: true, order: { select: { reference: true } } },
      });
      if (duplicate) {
        throw new Error(
          `M-PESA receipt ${receipt} is already attached to payment ${duplicate.id}.`,
        );
      }
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        mpesaReceipt: receipt || payment.mpesaReceipt,
        resultCode: resultCode ?? "0",
        resultDesc: resultDesc || "Payment confirmed",
        rawCallback: raw || undefined,
        completedAt: new Date(),
        failureReason: null,
      },
    });

    const nextStatus = ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(payment.order.status)
      ? "CONFIRMED"
      : payment.order.status;

    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "SUCCESS",
        status: nextStatus,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: `M-PESA payment confirmed${receipt ? ` (${receipt})` : ""}.`,
      },
    });

    return { alreadyProcessed: false, order, payment: updatedPayment };
  });

  if (!result.alreadyProcessed) {
    const { order } = result;
    await notify({
      userId: order.userId,
      orderId: order.id,
      type: "PAYMENT_CONFIRMED",
      title: `Payment received for ${order.reference}`,
      message: `We have received ${formatKES(order.total)} for order ${order.reference}. Your order is confirmed and is being prepared.`,
      email: order.email,
    });
  }

  return result;
}

export async function markPaymentFailed(paymentId, { reason, resultCode, resultDesc, raw, restoreStock = true }) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment not found.");
    if (payment.status === "SUCCESS") {
      return { alreadyProcessed: true, order: payment.order };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        resultCode: resultCode || null,
        resultDesc: resultDesc || null,
        failureReason: reason || resultDesc || "Payment failed.",
        rawCallback: raw || undefined,
        completedAt: new Date(),
      },
    });

    let order = payment.order;
    if (order.paymentStatus !== "SUCCESS") {
      order = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          status: order.status === "PENDING_PAYMENT" ? "PAYMENT_FAILED" : order.status,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Payment failed: ${reason || resultDesc || "unknown reason"}`,
        },
      });

      if (restoreStock) {
        await restoreStockForOrder(tx, order.id, {
          reason: `Stock released — payment failed for ${order.reference}`,
        });
      }
    }

    return { alreadyProcessed: false, order };
  });

  if (!result.alreadyProcessed) {
    const { order } = result;
    await notify({
      userId: order.userId,
      orderId: order.id,
      type: "PAYMENT_FAILED",
      title: `Payment not completed for ${order.reference}`,
      message: `Your M-PESA payment for order ${order.reference} was not completed. You can retry payment from your order confirmation page.`,
      email: order.email,
    });
  }

  return result;
}

/** Reconcile a pending payment by querying Daraja's STK query endpoint. */
export async function reconcilePayment(paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status !== "PENDING") return { updated: false, status: payment.status };
  if (!payment.checkoutRequestId) return { updated: false, status: payment.status };
  if (!isDarajaConfigured()) throw new Error("M-PESA is not configured.");

  const { queryStkStatus } = await import("@/lib/payments/daraja");
  const response = await queryStkStatus(payment.checkoutRequestId);

  if (response.ResultCode === "0") {
    const receipt = response.MpesaReceiptNumber || payment.mpesaReceipt;
    if (!receipt) return { updated: false, status: payment.status };
    await markPaymentSuccess(payment.id, {
      receipt,
      amount: payment.amount,
      resultCode: response.ResultCode,
      resultDesc: response.ResultDesc,
      raw: response,
    });
    return { updated: true, status: "SUCCESS" };
  }

  if (["1032", "1037", "1", "2001"].includes(String(response.ResultCode))) {
    await markPaymentFailed(payment.id, {
      reason: response.ResultDesc || "Payment was not completed.",
      resultCode: response.ResultCode,
      resultDesc: response.ResultDesc,
      raw: response,
    });
    return { updated: true, status: "FAILED" };
  }

  return { updated: false, status: payment.status, query: response };
}
