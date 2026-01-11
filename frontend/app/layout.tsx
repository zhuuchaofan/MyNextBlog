import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Color_Emoji } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { BackgroundGrid } from "@/components/ui/BackgroundGrid";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Noto Color Emoji - Google 风格 Emoji 字体，提供跨平台一致的 Emoji 显示
const notoEmoji = Noto_Color_Emoji({
  variable: "--font-noto-emoji",
  subsets: ["emoji"],
  weight: "400",
  display: "swap", // 优化性能：先显示备用字体，加载完成后切换
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://nextblog.zhuchaofan.com"),
  title: "球球布丁的摸鱼后花园",
  description: "A modern full-stack blog built with Next.js 16 and .NET 10.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 获取当前语言和翻译消息
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoEmoji.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <BackgroundGrid />
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
    </html>
  );
}