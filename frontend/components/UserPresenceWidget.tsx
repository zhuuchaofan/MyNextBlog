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
import { motion, AnimatePresence } from "framer-motion";
import { Code, Gamepad2, Music, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// 状态类型定义
interface UserPresenceStatus {
  status: string;
  icon: string;
  message: string;
  details?: string;
  timestamp: string;
}

// 状态配置映射
const STATUS_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    pulseColor: string;
    label: string;
  }
> = {
  coding: {
    icon: Code,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    pulseColor: "bg-blue-500",
    label: "编程中",
  },
  gaming: {
    icon: Gamepad2,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    pulseColor: "bg-purple-500",
    label: "游戏中",
  },
  listening: {
    icon: Music,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    pulseColor: "bg-green-500",
    label: "听歌中",
  },
  offline: {
    icon: Moon,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    pulseColor: "bg-gray-400",
    label: "离线",
  },
  custom: {
    icon: Sparkles,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    pulseColor: "bg-yellow-500",
    label: "自定义",
  },
};

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

  // 加载中或无数据时不显示
  if (isLoading || !status) {
    return null;
  }

  // 获取状态配置
  const config = STATUS_CONFIG[status.status] || STATUS_CONFIG.offline;
  const Icon = config.icon;
  const isOnline = status.status !== "offline";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex items-center gap-2 px-2.5 py-1.5 rounded-full cursor-default",
        "transition-colors duration-300",
        config.bgColor
      )}
      title={`${config.label}: ${status.message}${status.details ? ` (${status.details})` : ""}`}
    >
      {/* 图标容器 */}
      <div className="relative">
        {/* 呼吸灯效果 (仅在线状态) */}
        <AnimatePresence>
          {isOnline && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute inset-0 rounded-full",
                config.pulseColor
              )}
            />
          )}
        </AnimatePresence>

        {/* 图标 */}
        <Icon className={cn("relative h-4 w-4", config.color)} />

        {/* 状态指示点 */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
      </div>

      {/* 状态文本 (桌面端显示) */}
      <span
        className={cn(
          "hidden sm:inline text-xs font-medium truncate max-w-[100px]",
          config.color
        )}
      >
        {status.message}
      </span>
    </motion.div>
  );
}
