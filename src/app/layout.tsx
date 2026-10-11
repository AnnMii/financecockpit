import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Finanzcockpit", template: "%s · Finanzcockpit" },
  description: "Persönliches Finanzcockpit mit Kennzahlen und Rechnern.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
