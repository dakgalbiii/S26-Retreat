import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eventify",
  description: "Create and manage your events with ease.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  icons: {
    icon: '/running.png',
    shortcut: '/running.png',
    apple: '/running.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper min-h-screen">{children}</body>
    </html>
  );
}