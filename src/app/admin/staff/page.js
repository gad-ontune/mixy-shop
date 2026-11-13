import { Plus, ShieldCheck, Save, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFlash } from "@/components/admin/admin-flash";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { saveStaffAction, toggleStaffActiveAction } from "@/actions/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Staff" };

export default async function AdminStaffPage({ searchParams }) {
  const currentUser = await requirePermission(PERMISSIONS.STAFF_MANAGE, "/admin/staff");
  const params = await searchParams;

  const staff = await prisma.user.findMany({
    where: { role: { name: { in: ["ADMIN", "STAFF", "TECHNICIAN"] } } },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      staffProfile: true,
      _count: { select: { repairsAssigned: true, requestsAssigned: true } },
    },
    orderBy: [{ role: { name: "asc" } }, { name: "asc" }],
  });

  const roles = ["ADMIN", "STAFF", "TECHNICIAN"];

  return (
    <div className="space-y-5">
      <AdminFlash searchParams={params} />
      <AdminHeader
        title="Staff and permissions"
        description="Manage staff accounts. Permissions come from each person's role."
      />

      <div className="rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-brand" /> Add a staff account
          </h2>
        </div>
        <div className="bg-soft/40 p-5">
          <form action={saveStaffAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" required htmlFor="new-staff-name">
              <Input id="new-staff-name" name="name" required />
            </Field>
            <Field label="Email" required htmlFor="new-staff-email">
              <Input id="new-staff-email" name="email" type="email" required />
            </Field>
            <Field label="Phone" htmlFor="new-staff-phone">
              <Input id="new-staff-phone" name="phone" type="tel" placeholder="0712 345 678" />
            </Field>
            <Field label="Role" required htmlFor="new-staff-role">
              <Select id="new-staff-role" name="role" defaultValue="STAFF">
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Position" htmlFor="new-staff-position">
              <Input id="new-staff-position" name="position" placeholder="e.g. Sales assistant" />
            </Field>
            <Field
              label="Temporary password"
              required
              htmlFor="new-staff-password"
              hint="At least 8 characters. Share it securely."
            >
              <Input
                id="new-staff-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <div className="flex items-end">
              <SubmitButton pendingText="Creating…">
                <UserCog className="h-4 w-4" /> Create account
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {staff.map((member) => {
          const permissions = member.role.permissions.map((entry) => entry.permission.key);
          return (
            <div key={member.id} className="rounded-xl border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">
                      {member.name}
                      {member.id === currentUser.id ? (
                        <span className="ml-2 text-[10px] font-medium text-slate">(you)</span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-slate">
                      {member.email} · {member.staffProfile?.position || member.role.name.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={member.isActive ? "green" : "slate"}>
                    {member.isActive ? "Active" : "Disabled"}
                  </Badge>
                  <Badge tone={member.role.name === "ADMIN" ? "dark" : "blue"}>
                    {member.role.name}
                  </Badge>
                </div>
              </div>

              <details className="border-t border-line">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-[11px] font-medium text-brand">
                  Edit account and view permissions
                </summary>
                <form action={saveStaffAction} className="grid gap-3 border-t border-line bg-soft/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <input type="hidden" name="staffId" value={member.id} />
                  <Field label="Full name" htmlFor={`staff-name-${member.id}`}>
                    <Input id={`staff-name-${member.id}`} name="name" defaultValue={member.name} required />
                  </Field>
                  <Field label="Email" htmlFor={`staff-email-${member.id}`}>
                    <Input id={`staff-email-${member.id}`} name="email" type="email" defaultValue={member.email || ""} required />
                  </Field>
                  <Field label="Phone" htmlFor={`staff-phone-${member.id}`}>
                    <Input id={`staff-phone-${member.id}`} name="phone" type="tel" defaultValue={member.phone || ""} />
                  </Field>
                  <Field label="Role" htmlFor={`staff-role-${member.id}`}>
                    <Select id={`staff-role-${member.id}`} name="role" defaultValue={member.role.name}>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Position" htmlFor={`staff-position-${member.id}`}>
                    <Input
                      id={`staff-position-${member.id}`}
                      name="position"
                      defaultValue={member.staffProfile?.position || ""}
                    />
                  </Field>
                  <Field
                    label="New password"
                    htmlFor={`staff-password-${member.id}`}
                    hint="Leave blank to keep the current password."
                  >
                    <Input
                      id={`staff-password-${member.id}`}
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Optional"
                    />
                  </Field>
                  <div className="flex items-end">
                    <SubmitButton size="sm" pendingText="Saving…">
                      <Save className="h-3.5 w-3.5" /> Save account
                    </SubmitButton>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Role permissions
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate">
                      {permissions.length > 0
                        ? permissions.join(" · ")
                        : "No administrative permissions."}
                    </p>
                    <p className="mt-1 text-[11px] text-slate">Joined {formatDate(member.createdAt)}</p>
                  </div>
                </form>
                {member.id !== currentUser.id ? (
                  <form action={toggleStaffActiveAction} className="border-t border-line px-4 py-2.5">
                    <input type="hidden" name="staffId" value={member.id} />
                    <button
                      type="submit"
                      className="text-[11px] font-medium text-red-600 hover:underline"
                    >
                      {member.isActive ? "Deactivate account" : "Reactivate account"}
                    </button>
                  </form>
                ) : null}
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
