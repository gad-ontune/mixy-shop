import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { requireAdminArea } from "@/lib/authz";
import { signOutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/ui/logo";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · MIX Admin",
  },
};

export default async function AdminLayout({ children }) {
  const user = await requireAdminArea();

  return (
    <div className="min-h-screen bg-soft/30">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center">
              <Logo className="h-7" />
            </Link>
            <span className="hidden rounded-md border border-line bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate sm:inline">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate hover:text-brand sm:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> View site
            </Link>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
                {initials(user.name) || "MX"}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold text-ink">{user.name}</p>
                <p className="text-[11px] text-slate">{user.role || "Staff"}</p>
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium text-slate hover:border-brand/40 hover:text-brand"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-line px-4 sm:px-6 lg:hidden">
          <AdminNav user={user} variant="mobile" />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
          <AdminNav user={user} />
        </aside>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
