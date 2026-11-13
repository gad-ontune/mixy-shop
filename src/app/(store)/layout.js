import { StoreHeader } from "@/components/layout/store-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function StoreLayout({ children }) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
