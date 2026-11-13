import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "MIX — Technology made simpler",
    template: "%s · MIX",
  },
  description:
    "MIX brings your technology needs together: electronics and accessories, reliable phone repairs and convenient digital services in Nairobi, Kenya.",
  keywords: [
    "MIX Kenya",
    "electronics Nairobi",
    "phone accessories Kenya",
    "phone repair Nairobi",
    "printing cyber services",
  ],
  openGraph: {
    title: "MIX — Technology made simpler",
    description:
      "Electronics, phone accessories, phone repairs and digital services in Nairobi, Kenya.",
    type: "website",
    locale: "en_KE",
    siteName: "MIX",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
