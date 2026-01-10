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

// 状态类型定义
interface UserPresenceStatus {
  status: string;
  icon: string;
  message: string;
  details?: string;
  timestamp: string;
}

// 轮询间隔（毫秒）
const POLL_INTERVAL = 30000;

export function UserPresenceWidget() {
  const [status, setStatus] = useState<UserPresenceStatus | null>(null);
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
      // 网络错误时保持上一次状态，不清空
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex items-center gap-2 px-2.5 py-1.5 rounded-full cursor-default transition-colors duration-300",
        status.status === "coding" ? "bg-blue-500/10 dark:bg-blue-500/20" :
        status.status === "gaming" ? "bg-purple-500/10 dark:bg-purple-500/20" :
        status.status === "listening" ? "bg-green-500/10 dark:bg-green-500/20" :
        "bg-gray-500/5 dark:bg-gray-500/10"
      )}
      title={`${status.message}${status.details ? ` (${status.details})` : ""}`}
    >
      <StatusBadge 
        status={status.status} 
        icon={status.icon} 
        showPulse={isOnline}
        className="w-5 h-5 border-0 bg-transparent"
      />

      {/* 状态文本 (桌面端显示，超长时滚动) */}
      <div className="hidden sm:block relative overflow-hidden max-w-[120px]">
        <motion.span
          className={cn(
            "inline-block text-xs font-medium whitespace-nowrap",
            status.status === "coding" ? "text-blue-600 dark:text-blue-400" :
            status.status === "gaming" ? "text-purple-600 dark:text-purple-400" :
            status.status === "listening" ? "text-green-600 dark:text-green-400" :
            "text-gray-500 dark:text-gray-400"
          )}
          // 如果文本超过 10 个字符，则启动滚动动画
          animate={status.message.length > 10 ? {
            x: ["0%", "-50%"],
          } : {}}
          transition={status.message.length > 10 ? {
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: Math.max(status.message.length * 0.3, 3),
              ease: "linear",
            }
          } : {}}
        >
          {/* 滚动时需要两份文本来实现无缝循环 */}
          {status.message.length > 10 
            ? `${status.message}　　　${status.message}　　　`
            : status.message
          }
        </motion.span>
      </div>
    </motion.div>
  );
}
