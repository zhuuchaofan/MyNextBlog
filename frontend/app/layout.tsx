import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Color_Emoji } from "next/font/google"; // 引入 Noto Color Emoji
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { BackgroundGrid } from "@/components/ui/BackgroundGrid";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 配置 Noto Color Emoji
const notoEmoji = Noto_Color_Emoji({
  variable: "--font-noto-emoji",
  weight: "400",
  subsets: ["emoji"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://nextblog.zhuchaofan.online"),
  title: "MyNextBlog - Tech & Life",
  description: "A modern full-stack blog built with Next.js 16 and .NET 10.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  maximumScale: 1,
  userScalable: false,
};

import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        // 将 emoji 字体变量加入 class 列表
        className={`${geistSans.variable} ${geistMono.variable} ${notoEmoji.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
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
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
    </html>
  );
}