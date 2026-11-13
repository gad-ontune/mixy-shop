import { requireUser } from "@/lib/authz";
import { AccountNav } from "@/components/account/account-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My account",
};

export default async function AccountLayout({ children }) {
  const user = await requireUser("/account");

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        <AccountNav user={user} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
