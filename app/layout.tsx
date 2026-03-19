import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Prelude",
  description: "Your event companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prelude",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="theme-color" content="#f2ede4" />
      <body className="bg-paper min-h-screen">{children}</body>
    </html>
  );
}