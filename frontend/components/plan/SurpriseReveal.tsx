'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Heart, PartyPopper, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SurpriseRevealProps {
  title: string;
  description?: string;
  startDate: string;
  type: 'trip' | 'event' | 'surprise';
  onClose: () => void;
}

/**
 * 惊喜揭晓弹窗组件
 * 用于在纪念日或特定时间点揭晓秘密计划
 */
export default function SurpriseReveal({ title, description, startDate, type, onClose }: SurpriseRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // 揭晓动画
  const handleReveal = () => {
    setIsRevealed(true);
    
    // 触发彩带动画
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'trip': return '✈️';
      case 'event': return '🎉';
      case 'surprise': return '🎁';
      default: return '🎁';
    }
  };

  const getTypeName = () => {
    switch (type) {
      case 'trip': return '旅行计划';
      case 'event': return '活动安排';
      case 'surprise': return '神秘惊喜';
      default: return '惊喜';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center p-4",
      "bg-black/60 backdrop-blur-sm",
      "transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className={cn(
        "relative w-full max-w-md bg-gradient-to-br",
        "from-pink-50 via-white to-purple-50",
        "dark:from-zinc-900 dark:via-zinc-800 dark:to-purple-900/20",
        "rounded-3xl shadow-2xl overflow-hidden",
        "transform transition-all duration-500",
        isVisible ? "scale-100" : "scale-95"
      )}>
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <Sparkles className="absolute top-4 left-8 w-6 h-6 text-yellow-400 animate-pulse" />
          <Heart className="absolute top-12 right-12 w-5 h-5 text-pink-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <PartyPopper className="absolute bottom-16 left-6 w-5 h-5 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* 内容区域 */}
        <div className="relative p-8 text-center">
          {!isRevealed ? (
            <>
              {/* 未揭晓状态 */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg animate-pulse">
                  <Gift className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                有一个惊喜等着你！
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                点击下方按钮揭晓这个特别的安排
              </p>
              
              <Button
                onClick={handleReveal}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                揭晓惊喜
              </Button>
            </>
          ) : (
            <>
              {/* 已揭晓状态 */}
              <div className="mb-6 animate-bounce">
                <span className="text-6xl">{getTypeIcon()}</span>
              </div>
              
              <p className="text-sm text-pink-500 dark:text-pink-400 font-medium mb-2">
                {getTypeName()}
              </p>
              
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                {title}
              </h2>
              
              {description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {description}
                </p>
              )}
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium">
                📅 {startDate}
              </div>
              
              <div className="mt-6">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="rounded-full"
                >
                  太棒了！
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
