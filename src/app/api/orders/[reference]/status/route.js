import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { reference } = await params;
  const token = new URL(request.url).searchParams.get("token");

  const order = await prisma.order.findUnique({
    where: { reference },
    select: {
      reference: true,
      accessToken: true,
      userId: true,
      status: true,
      paymentStatus: true,
      updatedAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, resultDesc: true, failureReason: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const session = await auth();
  const authorized =
    order.accessToken === token ||
    (session?.user?.id && order.userId === session.user.id) ||
    session?.user?.role === "ADMIN";

  if (!authorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json(
    {
      reference: order.reference,
      status: order.status,
      paymentStatus: order.paymentStatus,
      latestPayment: order.payments[0] || null,
      updatedAt: order.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
