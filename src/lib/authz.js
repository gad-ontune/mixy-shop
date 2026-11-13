import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSIONS } from "@/lib/constants";

export async function getSessionUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireUser(returnTo = "/account") {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export async function requireAdminArea() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN" && !user.permissions?.length) {
    redirect("/account");
  }
  return user;
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function canManage(user, permission) {
  return hasPermission(user, permission);
}

export async function requirePermission(permission, returnTo = "/admin") {
  const user = await requireUser(returnTo);
  if (!hasPermission(user, permission)) {
    redirect(`${returnTo}?forbidden=${encodeURIComponent(permission)}`);
  }
  return user;
}

export async function assertPermission(permission) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
}

export { PERMISSIONS };
