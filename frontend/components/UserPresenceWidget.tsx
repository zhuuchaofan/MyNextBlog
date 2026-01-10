// 用户在线状态组件 (Digital Presence Widget)
// ==============================================================================
// 此组件展示站长的实时在线状态，轮询后端 API 获取数据。
//
// **展示状态**:
//   - Coding: 编程中（蓝色呼吸灯）
//   - Gaming: 游戏中（紫色呼吸灯）
//   - Listening: 听歌中（绿色呼吸灯）
//   - Offline: 离线（灰色静止）
//   - Custom: 自定义状态（黄色呼吸灯）

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UserPresence } from "@/lib/types";

// 轮询间隔（毫秒）
const POLL_INTERVAL = 30000;

export function UserPresenceWidget() {
  const [status, setStatus] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/backend/presence");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
      }
    } catch {
      console.warn("Presence fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载 + 轮询
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (isLoading || !status) {
    return null;
  }

  const isOnline = status.status !== "offline";

  const textColorClass = 
    status.status === "coding" ? "text-blue-600 dark:text-blue-400" :
    status.status === "gaming" ? "text-purple-600 dark:text-purple-400" :
    status.status === "listening" ? "text-green-600 dark:text-green-400" :
    "text-gray-500 dark:text-gray-400";

  const bgClass = 
    status.status === "coding" ? "bg-blue-500/10 dark:bg-blue-500/20" :
    status.status === "gaming" ? "bg-purple-500/10 dark:bg-purple-500/20" :
    status.status === "listening" ? "bg-green-500/10 dark:bg-green-500/20" :
    "bg-gray-500/5 dark:bg-gray-500/10";

  // 桌面端内容（始终显示文本，超长滚动）
  const desktopContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-colors duration-300",
        bgClass
      )}
      title={`${status.message}${status.details ? ` (${status.details})` : ""}`}
    >
      <StatusBadge 
        status={status.status} 
        icon={status.icon} 
        showPulse={isOnline}
        className="w-5 h-5 border-0 bg-transparent"
      />
      <div className="relative overflow-hidden max-w-[120px]">
        <motion.span
          className={cn("inline-block text-xs font-medium whitespace-nowrap", textColorClass)}
          animate={status.message.length > 8 ? { x: ["0%", "-50%"] } : {}}
          transition={status.message.length > 8 ? {
            x: { repeat: Infinity, repeatType: "loop", duration: Math.max(status.message.length * 0.3, 3), ease: "linear" }
          } : {}}
        >
          {status.message.length > 8 
            ? `${status.message}　　　${status.message}　　　`
            : status.message
          }
        </motion.span>
      </div>
    </motion.div>
  );

  // 移动端 Popover（点击弹出浮层，不挤开布局）
  const mobileContent = (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "relative flex items-center px-2 py-1.5 rounded-full transition-colors duration-300",
            bgClass
          )}
        >
          <StatusBadge 
            status={status.status} 
            icon={status.icon} 
            showPulse={isOnline}
            className="w-5 h-5 border-0 bg-transparent"
          />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="flex items-center gap-3">
          <StatusBadge 
            status={status.status} 
            icon={status.icon} 
            showPulse={isOnline}
            className="w-8 h-8"
          />
          <div>
            <p className={cn("text-sm font-medium", textColorClass)}>{status.message}</p>
            {status.details && (
              <p className="text-xs text-muted-foreground">{status.details}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(status.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {/* 桌面端：始终显示文本 */}
      <div className="hidden sm:block">{desktopContent}</div>
      {/* 移动端：点击弹出 Popover */}
      <div className="sm:hidden">{mobileContent}</div>
    </>
  );
}
