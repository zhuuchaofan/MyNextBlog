// 状态徽章组件 (StatusBadge)
// ==============================================================================
// 纯展示组件，负责根据状态渲染对应的图标和颜色。
// 可在导航栏 (UserPresenceWidget) 和 Admin 配置页复用。

import { 
  Code, 
  Gamepad2, 
  Headphones, 
  Moon, 
  Coffee,
  Zap,
  Monitor,
  Music
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  icon?: string;
  className?: string;
  showPulse?: boolean;
}

export function StatusBadge({ status, icon, className, showPulse = false }: StatusBadgeProps) {
  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case "coding": return "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      case "gaming": return "text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900";
      case "listening": return "text-green-500 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "offline": return "text-gray-400 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800";
      default: return "text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900";
    }
  };

  // 动态图标映射
  const renderIcon = () => {
    const iconProps = { className: "w-4 h-4" };
    
    // 如果后端返回了具体的 Icon 名称，优先匹配
    if (icon) {
      switch (icon) {
        case "Code": return <Code {...iconProps} />;
        case "Gamepad2": return <Gamepad2 {...iconProps} />;
        case "Headphones": return <Headphones {...iconProps} />;
        case "Moon": return <Moon {...iconProps} />;
        case "Coffee": return <Coffee {...iconProps} />;
        case "Zap": return <Zap {...iconProps} />;
        case "Monitor": return <Monitor {...iconProps} />;
        case "Music": return <Music {...iconProps} />;
      }
    }

    // fallback: 根据 status 匹配
    switch (status) {
      case "coding": return <Code {...iconProps} />;
      case "gaming": return <Gamepad2 {...iconProps} />;
      case "listening": return <Headphones {...iconProps} />;
      case "offline": return <Moon {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300",
      getStatusColor(status),
      className
    )}>
      {renderIcon()}
      
      {/* 呼吸灯效果 */}
      {showPulse && status !== "offline" && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === "coding" ? "bg-blue-400" :
            status === "gaming" ? "bg-purple-400" : 
            "bg-green-400"
          )}></span>
          <span className={cn(
            "relative inline-flex rounded-full h-2.5 w-2.5",
            status === "coding" ? "bg-blue-500" :
            status === "gaming" ? "bg-purple-500" : 
            "bg-green-500"
          )}></span>
        </span>
      )}
    </div>
  );
}
