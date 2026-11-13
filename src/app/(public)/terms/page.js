import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you shop, book a repair or request a digital service from MIX.",
};

const sections = [
  {
    title: "Using MIX",
    body: [
      "By using this website, placing an order or submitting a repair or service request, you agree to these terms.",
      "You must provide accurate contact and device information. You are responsible for activity carried out through your account, so keep your password private.",
    ],
  },
  {
    title: "Products and availability",
    body: [
      "Product descriptions, images and prices are provided in good faith. We try to keep stock information accurate, but availability can change.",
      "If an item becomes unavailable after an order is placed, we will contact you to arrange a refund, replacement or an alternative.",
      "Manufacturer warranties and any MIX warranty are explained at the point of sale. Warranty does not cover accidental damage, liquid damage or unauthorised repairs.",
    ],
  },
  {
    title: "Orders and payment",
    body: [
      "Orders are confirmed only after payment has been verified on our server.",
      "M-PESA payments are initiated through Safaricom Daraja. We never ask for your M-PESA PIN.",
      "Prices are shown in Kenyan Shillings and include applicable taxes unless stated otherwise. Delivery charges are shown at checkout before payment.",
    ],
  },
  {
    title: "Collection and delivery",
    body: [
      "Collection orders must be collected from the MIX shop during opening hours. Bring your order reference.",
      "Delivery is available within the areas we confirm at checkout. You are responsible for providing accurate address details and for being available to receive the order.",
    ],
  },
  {
    title: "Repairs",
    body: [
      "A repair request is not an acceptance of the repair. We diagnose the device first and will contact you with an estimate where needed.",
      "Repairs may carry risks inherent to the device and its condition. We will explain significant risks before proceeding.",
      "Please back up your data before handing in a device. MIX is not responsible for data loss, and you should remove or secure sensitive information where possible.",
      "Uncollected devices may be subject to storage arrangements after we contact you. We will make reasonable efforts to reach you before taking any further step.",
    ],
  },
  {
    title: "Digital services",
    body: [
      "Quotes for digital services are based on the information you provide and may change if the work required is different from what was described.",
      "You must have the right to use and share any file you upload. We may refuse work that is unlawful or infringes another person's rights.",
      "Please keep a copy of any file you upload. We are not a permanent backup service.",
    ],
  },
  {
    title: "Returns and refunds",
    body: [
      "Returns are accepted in line with the applicable consumer law and our stated return conditions.",
      "To request a return, contact MIX with your order reference and the reason for the return. Items should be in the condition in which they were supplied, with packaging and accessories where applicable.",
      "Approved refunds are processed through the original payment method where possible.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "We provide the website and services with reasonable care, but we do not guarantee uninterrupted or error-free operation.",
      "To the extent permitted by law, MIX is not liable for indirect or consequential loss. Nothing in these terms limits rights you have under Kenyan consumer law.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      "We may update these terms from time to time. The version published on this page applies when you use the service.",
      "If you have a question about these terms, contact MIX through the contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of service."
        description="The terms that apply to shopping, repairs and digital services at MIX."
      />

      <section className="section">
        <div className="container-page max-w-3xl">
          <p className="text-sm text-slate">Last updated: November 2026</p>

          <p className="mt-4 text-sm leading-7 text-slate">
            These terms apply to your use of the MIX website and to orders, repairs and digital
            service requests made through it. Please read them before you buy or submit a request.
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
          </div>

          <div className="mt-10 border-t border-line pt-5">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              <ArrowLeft className="h-4 w-4" /> Back to MIX
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
