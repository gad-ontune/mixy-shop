"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

export function PaymentStatusPoller({ reference, token, initialPaymentStatus }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const settled = initialPaymentStatus !== "PENDING";

  useEffect(() => {
    if (settled) return undefined;

    let cancelled = false;
    const query = new URLSearchParams();
    if (token) query.set("token", token);

    const check = async () => {
      if (cancelled) return;
      setChecking(true);
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(reference)}/status?${query.toString()}`,
          { cache: "no-store" },
        );
        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data.paymentStatus !== "PENDING") {
            router.refresh();
            return;
          }
        }
      } catch {
        // A failed poll is not fatal; the next interval tries again.
      } finally {
        if (!cancelled) {
          setChecking(false);
          setAttempts((value) => value + 1);
        }
      }
    };

    const timer = setInterval(check, 5000);
    check();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [reference, token, settled, router]);

  if (settled) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate">
      {checking ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 text-brand" />
      )}
      <span>
        {checking ? "Checking payment status…" : "Waiting for M-PESA confirmation."}{" "}
        {attempts > 2 ? "This page updates automatically." : "Keep this page open."}
      </span>
    </div>
  );
}
