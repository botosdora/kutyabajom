import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@/components/toast";
import { ACCENT_COOKIE, parseAccent, parseTheme, THEME_COOKIE } from "@/lib/appearance";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Kutyabajom", template: "%s · Kutyabajom" },
  description: "Kutyád egészsége, gyógyszerei és mindennapjai egy helyen.",
  appleWebApp: { capable: true, title: "Kutyabajom", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1218" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const accent = parseAccent(store.get(ACCENT_COOKIE)?.value);

  return (
    <html lang="hu" className={inter.variable} data-theme={theme} data-accent={accent}>
      <body className="min-h-dvh antialiased">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
