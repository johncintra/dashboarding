import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Dash Comparativo | Leads para Lançamentos",
  description:
    "Dashboard comparativo premium para acompanhar captação de leads em lançamentos digitais por tempo relativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
