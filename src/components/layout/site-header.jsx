import { getSessionUser } from "@/lib/authz";
import { getCartCount } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";

export async function SiteHeader() {
  const [user, cartCount, settings] = await Promise.all([
    getSessionUser(),
    getCartCount(),
    getSettings(),
  ]);

  return (
    <SiteHeaderShell
      user={user}
      cartCount={cartCount}
      phone={settings.phone}
      whatsapp={settings.whatsapp}
      openingHours={settings.openingHours}
    />
  );
}
