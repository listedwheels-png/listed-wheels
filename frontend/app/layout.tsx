import type { Metadata } from "next";
import { Inter, Sora, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ListedWheels - Trust-focused Marketplace for Used Vehicles in India",
  description: "Buy and sell verified used cars, bikes, and cycles in India with direct WhatsApp seller contact, RTO checks, and zero brokerage.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${notoDevanagari.variable}`}>
      <body className="min-h-screen bg-paper text-ink-900 font-sans antialiased flex flex-col selection:bg-accent-500/30 selection:text-ink-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16 sm:pb-0">{children}</main>
          <BottomNav />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
