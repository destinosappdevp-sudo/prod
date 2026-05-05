import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { NavigationLoader } from "./components/NavigationLoader";
import LoggedInBottomNav from "./components/LoggedInBottomNav";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { createClient } from "@/app/lib/supabase/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Destinos Venezuela",
  description: "Destinos Venezuela",
  icons: {
    icon: "/favicon.webp",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <NavigationLoader />
        <Navbar />
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</main>
        <Footer />
        <LoggedInBottomNav isLoggedIn={!!user} />
        <CookieConsentBanner isLoggedIn={!!user} />
      </body>
    </html>
  );
}
