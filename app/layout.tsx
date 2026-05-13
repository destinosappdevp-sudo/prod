import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { NavigationLoader } from "./components/NavigationLoader";
import LoggedInBottomNav from "./components/LoggedInBottomNav";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
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

  const dbUser = user?.id
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      })
    : null;

  const showLoggedInBottomNav = !!user && dbUser?.role === "GUEST";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <NavigationLoader />
        <Navbar />
        <main
          className={
            showLoggedInBottomNav
              ? "flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
              : "flex-1"
          }
        >
          {children}
        </main>
        <Footer />
        <LoggedInBottomNav isLoggedIn={showLoggedInBottomNav} />
        <CookieConsentBanner isLoggedIn={!!user} />
      </body>
    </html>
  );
}
