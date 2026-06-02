import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { LanguageSwitcher, LocaleProvider, RuntimeLocalizer } from "@smatway/i18n";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmatWay Admin Dashboard",
  description: " Admin dashboard for SmatWay, the smart transportation solution. Monitor bookings, manage users, and view analytics in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider storageKey="smatway:locale">
          <RuntimeLocalizer />
          {children}
          <LanguageSwitcher floating />
        </LocaleProvider>
      </body>
    </html>
  );
}
