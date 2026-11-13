import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOrderByReference(reference) {
  return prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
}

export function canViewOrder(order, user, token) {
  if (!order) return false;
  if (token && order.accessToken === token) return true;
  if (user?.id && order.userId === user.id) return true;
  if (user?.role === "ADMIN") return true;
  return false;
}

export async function getCustomerOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function orderTimelineForFulfilment(fulfilmentMethod) {
  if (fulfilmentMethod === "DELIVERY") {
    return ["CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "COMPLETED"];
  }
  return ["CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "COMPLETED"];
}
