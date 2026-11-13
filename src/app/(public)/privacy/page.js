import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How MIX collects, uses, stores and protects personal information for store orders, repairs and digital services.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "Contact details you give us, such as your name, phone number, email address and delivery address.",
      "Order, repair and service request details, including device information, instructions and any files you choose to upload.",
      "Payment information needed to reconcile M-PESA transactions. We do not store your M-PESA PIN or full payment credentials.",
      "Basic technical information required to operate the website securely, such as session cookies and server logs.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To process and deliver orders, provide repairs and complete digital service requests.",
      "To verify M-PESA payments and prevent fraud.",
      "To contact you about an order, repair, quote or request.",
      "To maintain accurate business records and respond to support enquiries.",
      "To improve our products, services and website experience.",
    ],
  },
  {
    title: "Payments",
    body: [
      "M-PESA payments are initiated through Safaricom Daraja. Your PIN is entered on your own phone and is never requested by MIX.",
      "Payment callbacks are verified on our server before an order is treated as paid. We retain transaction references and receipts for reconciliation and dispute handling.",
    ],
  },
  {
    title: "Uploaded files and images",
    body: [
      "Photos of devices and documents you upload for repairs or digital services are stored privately.",
      "They are not publicly accessible. Access is limited to authorised MIX staff and to the signed-in customer who submitted them.",
    ],
  },
  {
    title: "Sharing and disclosure",
    body: [
      "We do not sell your personal information.",
      "We may share limited information with service providers who help us operate the business, such as payment, hosting or delivery providers, only where necessary to fulfil your request.",
      "We may disclose information where required by law or to protect the rights, safety and property of MIX, our customers or the public.",
    ],
  },
  {
    title: "Retention and security",
    body: [
      "We keep records for as long as needed to provide services, meet legal and accounting obligations, and resolve disputes.",
      "We use access controls, private file storage and server-side payment verification to protect information. No system is completely secure, so please use a strong password and keep it private.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can review and update your contact details in your account profile.",
      "You can ask us about the personal information we hold, or request correction or deletion where applicable, by contacting MIX.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy."
        description="How we handle the personal information you share with MIX."
      />

      <section className="section">
        <div className="container-page max-w-3xl">
          <p className="text-sm text-slate">Last updated: November 2026</p>

          <p className="mt-4 text-sm leading-7 text-slate">
            MIX provides electronics retail, device repair and digital services in Kenya. This
            policy explains what information we collect, why we collect it and how we protect it.
          </p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="mt-3 space-y-2">
                  {section.body.map((paragraph) => (
                    <li key={paragraph} className="flex gap-2.5 text-sm leading-7 text-slate">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {paragraph}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="text-lg font-semibold">Contact us</h2>
              <p className="mt-3 text-sm leading-7 text-slate">
                Questions about this policy or your information? Contact MIX through the{" "}
                <Link href="/contact" className="font-semibold text-brand">
                  contact page
                </Link>{" "}
                or visit our shop. We will respond as soon as we can.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-line pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
            >
              <ArrowLeft className="h-4 w-4" /> Back to MIX
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
