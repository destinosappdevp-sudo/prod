import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { NavigationLoader } from "./components/NavigationLoader";
import LoggedInBottomNav from "./components/LoggedInBottomNav";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Destinos Venezuela",
  description: "Destinos Venezuela",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.webp",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('admin-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col overflow-x-hidden`}>
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
        <PwaInstallPrompt />
        <CookieConsentBanner isLoggedIn={!!user} />
      </body>
    </html>
  );
}



