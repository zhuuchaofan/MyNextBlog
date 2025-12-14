import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Color_Emoji } from "next/font/google"; // 引入 Noto Color Emoji
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

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
  title: "My Tech Blog",
  description: "A modern tech blog built with Next.js and .NET",
};

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
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}