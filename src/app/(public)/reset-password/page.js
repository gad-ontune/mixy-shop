import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Logo } from "@/components/ui/logo";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = String(params?.token || "");

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Set a new password.</h1>
        <p className="mt-2 text-sm leading-6 text-slate">
          Choose a strong password for your MIX account. The reset link can only be used once.
        </p>
        <div className="mt-7">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <Alert tone="amber" title="Missing reset token">
              This page needs a valid reset link.{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
              .
            </Alert>
          )}
        </div>
      </div>
    </section>
  );
}
