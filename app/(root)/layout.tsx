export const dynamic = "force-dynamic";

import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";
import { Toaster } from "@/components/ui/sonner";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { StaffChromeGate } from "@/components/shared/StaffChromeGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-raleway)]">
      <Header />
      <EmailVerificationBanner />
      <main className="flex-1 ">{children}</main>
      <Toaster />
      {/* Marketing footer is ~960px; it belongs on guest pages, not on a tool. */}
      <StaffChromeGate>
        <Footer />
      </StaffChromeGate>
    </div>
  );
}
