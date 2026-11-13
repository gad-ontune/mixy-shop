import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Logo } from "@/components/ui/logo";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Reset your password.</h1>
        <p className="mt-2 text-sm leading-6 text-slate">
          Enter the email address on your MIX account. If it matches an account, we will send a
          link to set a new password.
        </p>
        <div className="mt-7">
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
