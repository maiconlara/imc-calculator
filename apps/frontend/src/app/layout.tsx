import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";

const headingFont = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "IMC Calculator", template: "%s | IMC Calculator" },
  description: "Acompanhamento da evolução do IMC dos alunos da academia.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0d0d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
