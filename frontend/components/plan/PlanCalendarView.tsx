'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPlanDay: boolean;
  planDayNumber?: number;
  theme?: string;
}

interface PlanCalendarViewProps {
  startDate: string;
  endDate?: string | null;
  className?: string;
}

/**
 * 计划日历视图组件
 * 显示计划时间范围内的日历，高亮显示计划日期
 */
export default function PlanCalendarView({ startDate, endDate, className }: PlanCalendarViewProps) {
  const calendarData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // 重置为午夜，避免时区问题
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setHours(0, 0, 0, 0); // 重置为午夜
    
    // 获取日历的开始（月初）和结束（月末）
    const calendarStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const calendarEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    
    // 调整到周日开始
    const firstDayOfWeek = calendarStart.getDay();
    calendarStart.setDate(calendarStart.getDate() - firstDayOfWeek);
    
    // 调整到周六结束
    const lastDayOfWeek = calendarEnd.getDay();
    if (lastDayOfWeek < 6) {
      calendarEnd.setDate(calendarEnd.getDate() + (6 - lastDayOfWeek));
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: CalendarDay[] = [];
    const current = new Date(calendarStart);
    let dayCounter = 1;
    
    while (current <= calendarEnd) {
      const isInPlanRange = current >= start && current <= end;
      const isCurrentMonth = current.getMonth() === start.getMonth() || 
                            Boolean(endDate && current.getMonth() === end.getMonth());
      
      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        isCurrentMonth,
        isToday: current.getTime() === today.getTime(),
        isPlanDay: isInPlanRange,
        planDayNumber: isInPlanRange ? dayCounter++ : undefined,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return {
      days,
      months: getMonthsInRange(start, end),
    };
  }, [startDate, endDate]);

  return (
    <div className={cn("", className)}>
      {/* 月份标题 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {calendarData.months.map((month, i) => (
          <span key={i} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {month}
          </span>
        ))}
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.days.map((day, i) => (
          <div
            key={i}
            className={cn(
              "relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors",
              day.isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-300 dark:text-gray-600",
              day.isPlanDay && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium",
              day.isToday && "ring-2 ring-blue-500",
              !day.isPlanDay && day.isCurrentMonth && "hover:bg-gray-100 dark:hover:bg-zinc-800"
            )}
          >
            <span>{day.dayNumber}</span>
            {day.planDayNumber && (
              <span className="absolute bottom-0.5 text-[10px] text-blue-500 dark:text-blue-400">
                D{day.planDayNumber}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/40" />
          <span>计划日期</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded ring-2 ring-blue-500" />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}

// 获取日期范围内的月份列表
function getMonthsInRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (current <= endMonth) {
    months.push(`${current.getFullYear()}年${current.getMonth() + 1}月`);
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}
