"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { fetchAnniversaries, type Anniversary } from "@/lib/api";
import { formatDaysSmart, formatDaysShort } from "@/lib/dateUtils";

// localStorage 键名（防止烟花重复播放）
const STORAGE_KEY = "anniversary_celebrated";

// 检查今天是否是纪念日（基于用户本地时间）
function checkIsAnniversary(startDate: string, repeatType: string): boolean {
  const today = new Date();
  const [year, month, day] = startDate.split("-").map(Number);

  switch (repeatType) {
    case "yearly":
      return today.getMonth() + 1 === month && today.getDate() === day;
    case "monthly":
      return today.getDate() === day;
    case "once":
      return (
        today.getFullYear() === year &&
        today.getMonth() + 1 === month &&
        today.getDate() === day
      );
    default:
      return false;
  }
}

// 检查是否已经看过烟花
function hasSeenCelebration(id: number): boolean {
  if (typeof window === "undefined") return true;
  const today = new Date().toDateString();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data[id] === today;
  } catch {
    return false;
  }
}

// 标记已看过烟花
function markCelebrated(id: number): void {
  if (typeof window === "undefined") return;
  const today = new Date().toDateString();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data[id] = today;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 忽略错误
  }
}

// 播放烟花动画
function playCelebration() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ["#ff69b4", "#ff1493", "#ff6b6b", "#ffd700", "#87ceeb"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// 爱心形状的 confetti
function playHeartConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ff69b4", "#ff1493", "#ff6b6b"],
    shapes: ["circle"],
    scalar: 1.2,
  });
}

export default function AnniversaryWidget() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [todayAnniversary, setTodayAnniversary] = useState<Anniversary | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载纪念日数据
  const loadData = useCallback(async () => {
    try {
      const data = await fetchAnniversaries();
      setAnniversaries(data);

      // 检查是否有今天的纪念日
      const todayAnn = data.find((ann) => checkIsAnniversary(ann.startDate, ann.repeatType));
      setTodayAnniversary(todayAnn || null);

      // 自动播放烟花（如果今天是纪念日且没看过）
      if (todayAnn && !hasSeenCelebration(todayAnn.id)) {
        setIsExpanded(true);
        setTimeout(() => {
          playCelebration();
          markCelebrated(todayAnn.id);
        }, 500);
      }
    } catch (error) {
      console.error("Failed to fetch anniversaries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 手动触发烟花
  const handleManualCelebrate = () => {
    playHeartConfetti();
  };

  // 如果没有纪念日数据，不显示挂件
  if (loading || anniversaries.length === 0) {
    return null;
  }

  // 获取要显示的纪念日（优先显示今天的，否则显示第一个）
  const displayAnn = todayAnniversary || anniversaries[0];
  const isToday = todayAnniversary !== null;

  return (
    <>
      {/* 浮动挂件 */}
      <div className="fixed z-50 bottom-4 right-4 md:bottom-6 md:right-6">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            // 展开态
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-200 dark:border-pink-800 p-4 w-80 max-h-[70vh] overflow-hidden flex flex-col"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    纪念日
                  </span>
                  <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-full">
                    {anniversaries.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 纪念日列表 */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                {anniversaries.map((ann) => {
                  const isAnnToday = checkIsAnniversary(ann.startDate, ann.repeatType);
                  return (
                    <div
                      key={ann.id}
                      className={`p-3 rounded-xl transition-all ${
                        isAnnToday
                          ? "bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800"
                          : "bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ann.emoji}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {ann.title}
                            </div>
                            {isAnnToday && (
                              <span className="text-xs text-pink-500 font-medium">
                                ✨ 今天！
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-pink-500">
                            {formatDaysSmart(ann.daysSinceStart, ann.displayType)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 放烟花按钮 */}
              <button
                onClick={handleManualCelebrate}
                className="mt-3 w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                放烟花 🎆
              </button>
            </motion.div>
          ) : (
            // 收起态
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsExpanded(true)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-xl
                transition-all hover:scale-105
                ${isToday 
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" 
                  : "bg-white/90 dark:bg-zinc-900/90 border border-pink-200 dark:border-pink-800"
                }
              `}
            >
              <Heart
                className={`w-5 h-5 ${isToday ? "text-white animate-pulse" : "text-pink-500"}`}
                fill={isToday ? "currentColor" : "none"}
              />
              <span className={`font-medium ${isToday ? "text-white" : "text-gray-700 dark:text-gray-200"}`}>
                {displayAnn.emoji} {formatDaysShort(displayAnn.daysSinceStart, displayAnn.displayType)}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 移动端底部占位（防止遮挡 Footer） */}
      <div className="h-16 md:hidden" />
    </>
  );
}
