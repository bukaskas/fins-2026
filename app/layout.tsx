import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/lib/constants";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { AuthProvider } from "@/components/shared/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | Fins`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
  openGraph: {
    title: { template: `%s | Fins`, default: APP_NAME },
    description: APP_DESCRIPTION,
    siteName: "Fins",
    type: "website",
    url: "/",
    images: [
      { url: "/images/hero_images/hero_desktop1.webp", width: 1200, height: 630, alt: APP_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: { template: `%s | Fins`, default: APP_NAME },
    description: APP_DESCRIPTION,
    images: ["/images/hero_images/hero_desktop1.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} ${robotoMono.variable}`}
      >
        <AuthProvider>
          {children}
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
