import { SiteNavbar } from "@/components/layout/SiteChrome";
import { Footer } from "@/components/layout/Footer";
import { CompareBar } from "@/components/compare/CompareBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNavbar />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CompareBar />
    </>
  );
}
