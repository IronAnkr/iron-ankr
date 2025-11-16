import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InviteModalWatcher } from "./components/auth/invite-modal";
import { AuthHashHandler } from "./components/auth/auth-hash-handler";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "./cart/cart-provider";
import { PageViewTracker } from "./components/analytics/page-view-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iron ankr",
  description: "Gym Straps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-black dark:text-white bg-white text-black`}
      >
        {/* Handle magic-link/invite hash fragments and initialize session */}
        <AuthHashHandler />
        <InviteModalWatcher />
        <CartProvider>
          {children}
        </CartProvider>
        {/* Global page view analytics (requires Suspense for useSearchParams) */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      </body>
      <GoogleAnalytics gaId="G-K2S57B1J45" />
    </html>
  );
}
