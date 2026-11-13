import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, MapPin, Wrench } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/ui/logo";
import { safeRedirectPath } from "@/lib/utils";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }) {
  const params = await searchParams;
  const callbackUrl = safeRedirectPath(params?.callbackUrl, "/account");

  return (
    <section className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Welcome back.</h1>
          <p className="mt-2 text-sm leading-6 text-slate">
            Sign in to track orders, follow repairs and manage your digital service requests.
          </p>

          <div className="mt-7">
            <SignInForm callbackUrl={callbackUrl} />
          </div>

          <div className="mt-8 rounded-xl border border-line bg-soft/50 p-4 text-xs leading-5 text-slate">
            <p className="font-semibold text-ink">Demo accounts</p>
            <p className="mt-1">Customer: customer@mix.co.ke / Customer@12345</p>
            <p>Admin: admin@mix.co.ke / Admin@12345</p>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=85"
          alt="Technology workspace"
          fill
          sizes="50vw"
          className="object-cover opacity-45"
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">One MIX account</p>
          <div>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-tight text-white">
              Your orders, repairs and requests in one place.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                [CheckCircle2, "Track order and payment status"],
                [Wrench, "Follow your phone repair from diagnosis to collection"],
                [ShieldCheck, "See digital service request progress"],
                [MapPin, "Keep your contact details up to date"],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-brand-300" /> {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/50">
            MIX · Technology made simpler · Nairobi, Kenya
          </p>
        </div>
      </div>
    </section>
  );
}
