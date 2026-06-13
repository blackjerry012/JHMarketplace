import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto"
});

export const metadata: Metadata = {
  title: "JH Marketplace | 鍵盤二手刊登平台",
  description: "A keyboard-focused second-hand marketplace for community listings."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${inter.variable} ${notoSansTc.variable}`}>{children}</body>
    </html>
  );
}
