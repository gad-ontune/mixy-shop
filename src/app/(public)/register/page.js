import Image from "next/image";
import { CheckCircle2, ShieldCheck, ShoppingBag } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/ui/logo";

export const metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <section className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your MIX account.</h1>
          <p className="mt-2 text-sm leading-6 text-slate">
            One account for shopping, repairs and digital services. It only takes a minute.
          </p>

          <div className="mt-7">
            <RegisterForm />
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-soft lg:block">
        <Image
          src="https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1400&q=85"
          alt="Wireless earbuds"
          fill
          sizes="45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-10 text-white">
          <h2 className="max-w-sm font-display text-3xl font-semibold leading-tight text-white">
            Shop, repair and get things done — with one account.
          </h2>
          <ul className="mt-5 space-y-2.5 text-sm text-white/85">
            {[
              [ShoppingBag, "Faster checkout with saved details"],
              [CheckCircle2, "Order history and tracking"],
              [ShieldCheck, "Private repair and document requests"],
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-brand-300" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
