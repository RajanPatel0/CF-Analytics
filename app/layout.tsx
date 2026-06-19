import "./globals.css";
import React from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "CausalFunnel Analytics Dashboard",
  description: "Advanced session tracking and click heatmap analytics",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0b0b0f] min-h-screen text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}