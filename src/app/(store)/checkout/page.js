import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/authz";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
  description: "Complete your MIX Store order with secure M-PESA payment.",
};

export default async function CheckoutPage() {
  const [cart, settings, user] = await Promise.all([
    getCart(),
    getSettings(),
    getSessionUser(),
  ]);
  const summary = summarizeCart(cart);

  if (!cart || summary.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <nav className="flex items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
        <Link href="/store" className="hover:text-brand">Store</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/cart" className="hover:text-brand">Cart</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">Checkout</span>
      </nav>

      <div className="mt-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-slate">
          Confirm your details, choose collection or delivery, then pay with M-PESA.
        </p>
      </div>

      {summary.hasIssues ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some items in your cart changed availability.{" "}
          <Link href="/cart" className="font-semibold underline">
            Review your cart
          </Link>{" "}
          before continuing.
        </div>
      ) : null}

      <div className="mt-7">
        <CheckoutForm summary={summary} settings={settings} user={user} />
      </div>
    </div>
  );
}
