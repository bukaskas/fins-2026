import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";
import { Toaster } from "@/components/ui/sonner";
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-raleway)]">
      <Header />
      <main className="flex-1 ">{children}</main>
      <Toaster />
      <Footer />
    </div>
  );
}
