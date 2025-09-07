import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InviteModalWatcher } from "./components/auth/invite-modal";
import { AuthHashHandler } from "./components/auth/auth-hash-handler";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {/* Handle magic-link/invite hash fragments and initialize session */}
        <AuthHashHandler />
        <InviteModalWatcher />
        {children}
      </body>
    </html>
  );
}
