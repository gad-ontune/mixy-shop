import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markPaymentFailed, markPaymentSuccess } from "@/lib/payments/process";
import { isAllowedCallbackSource } from "@/lib/payments/daraja";

const ACCEPTED = { ResultCode: 0, ResultDesc: "Accepted" };

/**
 * Safaricom Daraja STK callback endpoint.
 * Callbacks are verified against the CheckoutRequestID we stored when initiating
 * the push, the expected amount and the uniqueness of the M-PESA receipt.
 */
export async function POST(request) {
  try {
    if (!isAllowedCallbackSource(request.headers)) {
      console.warn("[mpesa] callback rejected from disallowed source");
      return NextResponse.json(ACCEPTED, { status: 202 });
    }

    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: callback.CheckoutRequestID },
      include: { order: true },
    });

    if (!payment) {
      console.warn(`[mpesa] unknown CheckoutRequestID ${callback.CheckoutRequestID}`);
      return NextResponse.json(ACCEPTED, { status: 200 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json(ACCEPTED, { status: 200 });
    }

    if (String(callback.ResultCode) === "0") {
      const metadata = callback.CallbackMetadata?.Item || [];
      const find = (name) => metadata.find((item) => item.Name === name)?.Value;

      const amount = find("Amount");
      const receipt = find("MpesaReceiptNumber");
      const transactionDate = find("TransactionDate");

      if (!receipt) {
        await markPaymentFailed(payment.id, {
          reason: "M-PESA callback did not include a receipt number.",
          resultCode: callback.ResultCode,
          resultDesc: callback.ResultDesc,
          raw: body,
          restoreStock: true,
        });
        return NextResponse.json(ACCEPTED, { status: 200 });
      }

      if (Number(amount) < payment.amount) {
        await markPaymentFailed(payment.id, {
          reason: `Paid amount ${amount} is less than the expected ${payment.amount}.`,
          resultCode: "AMOUNT_MISMATCH",
          resultDesc: callback.ResultDesc,
          raw: body,
          restoreStock: true,
        });
        return NextResponse.json(ACCEPTED, { status: 200 });
      }

      try {
        await markPaymentSuccess(payment.id, {
          receipt: String(receipt),
          amount: Number(amount),
          resultCode: String(callback.ResultCode),
          resultDesc: callback.ResultDesc,
          raw: { ...body, transactionDate },
        });
      } catch (error) {
        console.error("[mpesa] failed to apply successful callback", error);
        // Do not acknowledge success if we could not record it, so Safaricom retries.
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Could not record payment" }, { status: 500 });
      }
    } else {
      await markPaymentFailed(payment.id, {
        reason: callback.ResultDesc || "M-PESA payment was not completed.",
        resultCode: String(callback.ResultCode),
        resultDesc: callback.ResultDesc,
        raw: body,
        restoreStock: true,
      });
    }

    return NextResponse.json(ACCEPTED, { status: 200 });
  } catch (error) {
    console.error("[mpesa] callback error", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Callback error" }, { status: 500 });
  }
}
