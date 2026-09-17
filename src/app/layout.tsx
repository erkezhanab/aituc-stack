import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/i18n/server";
import { dictionaries } from "@/i18n";
import { I18nProvider } from "@/i18n/client";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const grotesk = Manrope({ subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "AITUC Stack",
  description: "AITUC Stack — домашние задания, оценки и рейтинг студентов клуба AITU",
};

// Applied before paint: saved theme, else system preference (no flash of wrong theme).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "kz" ? "kk" : "ru"} suppressHydrationWarning className={`${inter.variable} ${grotesk.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <I18nProvider locale={locale} dict={dictionaries[locale]}>{children}</I18nProvider>
      </body>
    </html>
  );
}
