import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { getCachedConfig } from "@/lib/content";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base metadata that will be enhanced with dynamic locale
export const metadata: Metadata = {
  title: "Ever Works | Professional Services",
  description:
    "Ever Works - Professional services and solutions for your business",
  keywords: ["Ever Works", "Professional Services", "Business Solutions"],
  openGraph: {
    title: "Ever Works | Professional Services",
    description:
      "Ever Works - Professional services and solutions for your business",
    type: "website",
    siteName: "Ever Works",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const config = await getCachedConfig();
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-dark--theme-950`}>
          <NextIntlClientProvider messages={messages}>
            <Providers config={config}>
              <Header session={session} />
              {children}
              <Footer />
              <div className="fixed bottom-6 right-6 z-50">
                <ScrollToTopButton
                  variant="elegant"
                  easing="easeInOut"
                  showAfter={400}
                  size="md"
                />
              </div>
            </Providers>
          </NextIntlClientProvider>
      </body>
    </html>
  );
}
