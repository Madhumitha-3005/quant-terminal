import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "QUANT_TERMINAL // Institutional Multi-Asset Intelligence",
  description: "Quantitative Multi-Asset Financial Intelligence & Backtesting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080b11] text-slate-100 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}