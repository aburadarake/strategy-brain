import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "プランニ・ング四世",
  description: "戦略の深層を、言葉に変える。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
