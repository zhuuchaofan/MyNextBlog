import type { Metadata } from "next"; // 导入 Next.js 的 Metadata 类型，用于定义页面的 SEO 信息（标题、描述等）。
import { Geist, Geist_Mono } from "next/font/google"; // 导入 Google 字体。Next.js 会自动优化和自托管这些字体。
import "./globals.css"; // 导入全局样式文件，通常包含 Tailwind CSS 的指令 (@tailwind base; 等)。
import { AuthProvider } from "@/context/AuthContext"; // 导入自定义的认证上下文提供者，用于全局管理登录状态。
import { Toaster } from "@/components/ui/sonner"; // 导入 shadcn/ui 的 Toast 组件，用于显示全局通知（如“登录成功”）。
import { ThemeProvider } from "@/components/theme-provider"; // 导入 next-themes 的主题提供者，用于实现明暗模式切换。

// 配置 Geist Sans 字体
const geistSans = Geist({
  variable: "--font-geist-sans", // 定义 CSS 变量名，方便在 Tailwind 中使用（如 font-sans）
  subsets: ["latin"], // 指定字符集，通常只加载 latin 以减小体积
});

// 配置 Geist Mono 字体（等宽字体，用于代码块）
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 定义全局元数据
// 这些信息会被注入到生成的 HTML <head> 标签中，对 SEO 至关重要。
export const metadata: Metadata = {
  title: "球球布丁的后花园 | Tech & Cats", // 网站标题
  description: "A cozy tech blog built with Next.js and ASP.NET Core", // 网站描述
};

// 根布局组件 (Root Layout)
// 这是 Next.js App Router 中最顶层的组件，所有页面都会包裹在它里面。
// 必须包含 <html> 和 <body> 标签。
export default function RootLayout({
  children, // 插槽：具体的页面内容（如 page.tsx）会渲染在这里
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: 防止因浏览器插件（如 Grammarly）修改 DOM 导致的水合不匹配警告
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        // 应用字体变量和全局背景/文字颜色
        // antialiased: 启用字体抗锯齿，让文字更清晰
        // transition-colors: 添加颜色过渡效果，让主题切换更丝滑
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-zinc-950 text-sm md:text-base transition-colors duration-300`}
      >
        {/* 主题提供者：包裹整个应用，使其支持深色模式 */}
        <ThemeProvider
          attribute="class" // 使用 CSS class (.dark) 来应用主题
          defaultTheme="system" // 默认跟随系统主题
          enableSystem
          disableTransitionOnChange // 切换时不播放过渡动画（避免闪烁）
        >
          {/* 认证提供者：包裹整个应用，使任何组件都能获取用户登录状态 */}
          <AuthProvider>
            {children} {/* 渲染子页面 */}
            {/* 全局 Toast 通知组件 */}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}