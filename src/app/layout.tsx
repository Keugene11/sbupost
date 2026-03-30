import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SBUPost — Stony Brook Social",
  description: "The social network for Stony Brook University students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
