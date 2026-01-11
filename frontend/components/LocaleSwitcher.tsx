'use client';

// components/LocaleSwitcher.tsx
// 语言切换组件 - 点击后设置 Cookie 并刷新页面
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 切换语言的函数
function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1年
  window.location.reload();
}

export function LocaleSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
          aria-label="切换语言"
        >
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocaleCookie('zh')} className="cursor-pointer gap-2">
          <span className="font-medium text-sm">中</span>
          <span>简体中文</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocaleCookie('en')} className="cursor-pointer gap-2">
          <span className="font-medium text-sm">EN</span>
          <span>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
