import "server-only";
import { prisma } from "@/lib/prisma";

export async function getSettings() {
  return prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function getActiveAnnouncement() {
  const now = new Date();
  return prisma.announcement.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActivePromotion() {
  const now = new Date();
  return prisma.promotion.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export function publicSettings(settings) {
  return {
    businessName: settings.businessName,
    tagline: settings.tagline,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    openingHours: settings.openingHours,
    deliveryEnabled: settings.deliveryEnabled,
    collectionEnabled: settings.collectionEnabled,
    deliveryFee: settings.deliveryFee,
    deliveryCoverage: settings.deliveryCoverage,
    lowStockThreshold: settings.lowStockThreshold,
    mpesaEnabled: settings.mpesaEnabled,
  };
}
