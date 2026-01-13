import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-raleway)]">
      <Header />
      <main className="flex-1 ">{children}</main>
      <Footer />
    </div>
  );
}
