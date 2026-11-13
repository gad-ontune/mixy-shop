import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { formatDate } from "@/lib/format";
import { ProfileForm } from "@/components/account/profile-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "My profile" };

export default async function AccountProfilePage() {
  const sessionUser = await requireUser("/account/profile");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      customerProfile: true,
      role: true,
      _count: { select: { orders: true, repairRequests: true, serviceRequests: true } },
    },
  });

  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-white p-6">
        <h1 className="text-lg font-semibold">Account not found</h1>
        <p className="mt-1 text-sm text-slate">
          We could not load your account. Please sign out and sign in again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">Profile</h1>
          <p className="mt-1.5 text-sm text-slate">
            Keep your contact details up to date for orders, repairs and delivery.
          </p>
        </div>
        <Badge tone="slate">{user.role?.name || "Customer"}</Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Contact details</h2>
          <p className="mt-0.5 text-xs text-slate">
            This information is only used to contact you about your MIX orders, repairs and requests.
          </p>
          <div className="mt-5">
            <ProfileForm user={user} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 text-sm">
            <h2 className="font-semibold">Account summary</h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="truncate text-right font-medium text-ink">
                  {user.email || "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Member since</dt>
                <dd className="text-right font-medium text-ink">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Orders</dt>
                <dd className="text-right font-medium text-ink">{user._count.orders}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Repairs</dt>
                <dd className="text-right font-medium text-ink">{user._count.repairRequests}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Service requests</dt>
                <dd className="text-right font-medium text-ink">
                  {user._count.serviceRequests}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-soft/40 p-5 text-xs leading-5 text-slate">
            <p className="font-semibold text-ink">Password and security</p>
            <p className="mt-1.5">
              Need to change your password? Sign out and use the “Forgot password” link on the sign
              in page to set a new one.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
