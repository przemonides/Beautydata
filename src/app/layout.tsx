import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treatly — CRM dla salonów beauty",
  description: "Nowoczesny CRM dla salonów kosmetycznych i fryzjerskich",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
