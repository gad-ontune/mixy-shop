import { Save, Megaphone, ShieldCheck, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/format";
import { paymentMode } from "@/lib/payments/process";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  saveSettingsAction,
  saveAnnouncementAction,
  toggleAnnouncementAction,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage({ searchParams }) {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE, "/admin/settings");
  const params = await searchParams;

  const [settings, announcements, auditLogs] = await Promise.all([
    getSettings(),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Business settings"
        description="Contact details, fulfilment options and payment availability shown to customers."
        actions={
          <Badge tone={paymentMode() === "simulation" ? "amber" : "green"}>
            Payments: {paymentMode() === "simulation" ? "simulation" : "live"}
          </Badge>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <form action={saveSettingsAction} className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Business details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Business name" required htmlFor="businessName">
                <Input id="businessName" name="businessName" defaultValue={settings.businessName} required />
              </Field>
              <Field label="Tagline" htmlFor="tagline">
                <Input id="tagline" name="tagline" defaultValue={settings.tagline || ""} />
              </Field>
              <Field label="Phone" required htmlFor="phone">
                <Input id="phone" name="phone" defaultValue={settings.phone} required />
              </Field>
              <Field
                label="WhatsApp"
                required
                htmlFor="whatsapp"
                hint="Digits only, including country code."
              >
                <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} required />
              </Field>
              <Field label="Email" required htmlFor="email">
                <Input id="email" name="email" type="email" defaultValue={settings.email} required />
              </Field>
              <Field label="Opening hours" required htmlFor="openingHours">
                <Input id="openingHours" name="openingHours" defaultValue={settings.openingHours} required />
              </Field>
              <Field label="Shop address" required htmlFor="address" className="sm:col-span-2">
                <Input id="address" name="address" defaultValue={settings.address} required />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold">Fulfilment</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Delivery fee (KES)" htmlFor="deliveryFee">
                <Input
                  id="deliveryFee"
                  name="deliveryFee"
                  type="number"
                  min="0"
                  defaultValue={settings.deliveryFee}
                />
              </Field>
              <Field label="Low stock threshold" htmlFor="lowStockThreshold">
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  defaultValue={settings.lowStockThreshold}
                />
              </Field>
              <Field label="Delivery coverage" htmlFor="deliveryCoverage" className="sm:col-span-2">
                <Input
                  id="deliveryCoverage"
                  name="deliveryCoverage"
                  defaultValue={settings.deliveryCoverage || ""}
                  placeholder="Areas you deliver to"
                />
              </Field>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-line pt-4">
              {[
                ["collectionEnabled", "Allow shop collection", settings.collectionEnabled],
                ["deliveryEnabled", "Allow delivery", settings.deliveryEnabled],
                ["mpesaEnabled", "Accept M-PESA at checkout", settings.mpesaEnabled],
              ].map(([name, label, checked]) => (
                <label key={name} className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={checked}
                    className="h-4 w-4 rounded border-line text-brand"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingText="Saving settings…">
              <Save className="h-4 w-4" /> Save settings
            </SubmitButton>
            <p className="text-xs text-slate">
              Changes take effect immediately on the website.
            </p>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
              <Megaphone className="h-4 w-4 text-brand" /> Announcements
            </h2>
            <div className="border-b border-line bg-soft/40 p-4">
              <form action={saveAnnouncementAction} className="space-y-2">
                <Textarea
                  name="message"
                  rows={2}
                  maxLength={240}
                  placeholder="e.g. We are open on Saturday until 6 PM."
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked
                      className="h-4 w-4 rounded border-line text-brand"
                    />
                    Show on the website
                  </label>
                  <SubmitButton size="sm" pendingText="Saving…">
                    Publish
                  </SubmitButton>
                </div>
              </form>
            </div>
            {announcements.length > 0 ? (
              <ul className="divide-y divide-line">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-5 text-ink">{announcement.message}</p>
                      <Badge tone={announcement.isActive ? "green" : "slate"}>
                        {announcement.isActive ? "Live" : "Off"}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate">
                        {formatDateTime(announcement.createdAt)}
                      </span>
                      <form action={toggleAnnouncementAction}>
                        <input type="hidden" name="announcementId" value={announcement.id} />
                        <button type="submit" className="text-[11px] font-medium text-brand hover:underline">
                          {announcement.isActive ? "Turn off" : "Turn on"}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-xs text-slate">No announcements yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold">
              <Activity className="h-4 w-4 text-brand" /> Recent admin activity
            </h2>
            {auditLogs.length > 0 ? (
              <ul className="divide-y divide-line">
                {auditLogs.map((log) => (
                  <li key={log.id} className="px-4 py-2.5">
                    <p className="text-[11px] font-medium text-ink">
                      {log.action.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="text-[11px] text-slate">
                      {log.entity}
                      {log.entityId ? ` · ${log.entityId}` : ""} ·{" "}
                      {log.user?.name || "System"} · {formatDateTime(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-xs text-slate">No activity recorded yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-soft/40 p-4 text-[11px] leading-5 text-slate">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Security reminder
            </p>
            <p className="mt-1.5">
              M-PESA credentials and callback secrets stay in server environment variables. Never
              paste them into settings fields, announcements or product descriptions.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
