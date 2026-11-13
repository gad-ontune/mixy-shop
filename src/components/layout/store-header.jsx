import { getSessionUser } from "@/lib/authz";
import { getCartCount } from "@/lib/cart";
import { getActiveAnnouncement, getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { StoreHeaderShell } from "@/components/layout/store-header-shell";

export async function StoreHeader() {
  const [user, cartCount, settings, announcement, categories] = await Promise.all([
    getSessionUser(),
    getCartCount(),
    getSettings(),
    getActiveAnnouncement(),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const message =
    announcement?.message ||
    "Secure M-PESA checkout · Collect at our Nairobi CBD shop or ask about delivery.";

  return (
    <StoreHeaderShell
      user={user}
      cartCount={cartCount}
      announcement={message}
      categories={categories}
      phone={settings.phone}
    />
  );
}
