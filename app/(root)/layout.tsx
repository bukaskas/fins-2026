export const dynamic = "force-dynamic";

import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";
import { Toaster } from "@/components/ui/sonner";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

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
      <Footer />
    </div>
  );
}
