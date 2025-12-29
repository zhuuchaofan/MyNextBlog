'use client';

import { useEffect, useState, useRef } from 'react';
import { pulseStats } from '@/lib/api';
import { Activity, Clock, BarChart3, BookOpen, MessageCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsWidgetProps {
  className?: string;
  systemStatus?: string;
  totalVisitsLabel?: string;
  serverTimeLabel?: string;
}

export default function StatsWidget({ 
  className,
  systemStatus = "系统运转正常",
  totalVisitsLabel = "累计访问量",
  serverTimeLabel = "服务器时间"
}: StatsWidgetProps) {
  const [visits, setVisits] = useState<number | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [runningDays, setRunningDays] = useState<number>(0);
  const [time, setTime] = useState<string>('');
  // 使用固定初始值避免 hydration mismatch
  const [sparklineData, setSparklineData] = useState<number[]>([35, 28, 42, 38, 45, 32, 40, 36, 48, 30, 44, 38, 42, 35, 40]);
  const hasFetched = useRef(false);

  useEffect(() => {
    // 1. 获取统计数据 (Strict Mode 防抖)
    if (!hasFetched.current) {
        hasFetched.current = true;
        pulseStats()
            .then(data => {
                if (data && typeof data.visits === 'number') {
                    setVisits(data.visits);
                    setPostsCount(data.postsCount || 0);
                    setCommentsCount(data.commentsCount || 0);
                    setRunningDays(data.runningDays || 0);
                }
            })
            .catch(err => console.error("Stats pulse failed:", err));
    }

    // 2. 时钟更新
    const updateTime = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString('zh-CN', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // 3. Sparkline 数据更新
    const sparkTimer = setInterval(() => {
        setSparklineData(prev => {
           const newData = [...prev.slice(1), 20 + Math.random() * 40];
           return newData;
        });
    }, 2000);

    return () => {
        clearInterval(timer);
        clearInterval(sparkTimer);
    };
  }, []);

  const formattedVisits = visits ? visits.toLocaleString() : '---';

  // 简单的 SVG Sparkline 路径生成
  const getSparklinePath = (data: number[]) => {
      if (data.length === 0) return "";
      const max = Math.max(...data, 60);
      const min = Math.min(...data, 10);
      const range = max - min;
      const width = 100;
      const height = 40;
      
      const points = data.map((val, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          return `${x},${y}`;
      });
      return `M${points.join(' L')}`;
  };

  return (
    <div className={cn(
        "relative overflow-hidden rounded-3xl p-6 transition-all duration-500",
        "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md", // Glassmorphism
        "border border-gray-100 dark:border-zinc-800",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
        "group hover:border-orange-500/20 dark:hover:border-orange-500/20", 
        className
    )}>
        {/* 背景光效 */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
        
        {/* 顶部状态栏 */}
        <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-sm"></span>
                </span>
                <span className="text-xs font-bold tracking-wide text-green-700 dark:text-green-400">
                    {systemStatus}
                </span>
            </div>
            <Activity className="w-4 h-4 text-gray-400 dark:text-zinc-600 animate-pulse" />
        </div>

        {/* 核心数据 Grid 布局 */}
        <div className="grid grid-cols-2 gap-6 relative z-10">
            {/* 左侧：累计访问 */}
            <div className="space-y-1">
                <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" />
                    {totalVisitsLabel}
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tabular-nums tracking-tight">
                    {formattedVisits}
                </div>
            </div>

            {/* 右侧：趋势图 */}
            <div className="relative h-12 w-full flex items-end opacity-80">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path 
                        d={getSparklinePath(sparklineData)} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-orange-500/60 dark:text-orange-400/80 drop-shadow-sm"
                    />
                    {/* 微弱的填充效果 */}
                     <path 
                        d={`${getSparklinePath(sparklineData)} L100,40 L0,40 Z`} 
                        fill="currentColor" 
                        className="text-orange-500/5 dark:text-orange-400/10"
                        stroke="none"
                    />
                </svg>
            </div>
        </div>

        {/* 装饰性分割线 */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-800 to-transparent my-6" />

        {/* 底部信息: 时间 & 真实统计 */}
        <div className="space-y-4">
             {/* 文章总数 */}
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500 font-medium">
                     <BookOpen className="w-3.5 h-3.5" />
                     文章总数
                 </div>
                 <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                     {postsCount}
                 </div>
             </div>

             {/* 评论总数 */}
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500 font-medium">
                     <MessageCircle className="w-3.5 h-3.5" />
                     评论总数
                 </div>
                 <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                     {commentsCount}
                 </div>
             </div>

             {/* 运行天数 */}
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500 font-medium">
                     <Zap className="w-3.5 h-3.5" />
                     运行天数
                 </div>
                 <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                     {runningDays} 天
                 </div>
             </div>

             {/* 服务器时间 */}
             <div className="flex items-center justify-between pt-2">
                 <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500 font-medium">
                     <Clock className="w-3.5 h-3.5" />
                     {serverTimeLabel}
                 </div>
                 <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                     {time}
                 </div>
             </div>
        </div>
    </div>
  );
}