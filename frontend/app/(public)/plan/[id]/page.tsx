'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPublicPlanById, type PublicPlanDetail } from '@/lib/api';
import { format, differenceInDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, Calendar as CalendarIcon, Heart, ArrowRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function PublicPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [plan, setPlan] = useState<PublicPlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPublicPlanById(parseInt(id));
        setPlan(data);
      } catch (error) {
        console.error('Failed to load plan:', error);
        // 公开 API 不存在时显示错误
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPlan();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50/30 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50/30 dark:bg-zinc-950 px-4">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 text-gray-300 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">找不到计划</h1>
          <p className="text-gray-500">可能是链接失效了，或者你需要登录才能查看。</p>
          <Button onClick={() => router.push('/login')}>去登录</Button>
        </div>
      </div>
    );
  }

  const startDate = parseISO(plan.startDate);
  const endDate = plan.endDate ? parseISO(plan.endDate) : startDate;
  
  // 将今天的时间设为当天的开始（00:00:00），以确保日期比较正确
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算状态 - 使用 startDate 的日期部分进行比较
  let statusText = '';
  const startDateNormalized = new Date(startDate);
  startDateNormalized.setHours(0, 0, 0, 0);
  const endDateNormalized = new Date(endDate);
  endDateNormalized.setHours(0, 0, 0, 0);
  
  const daysUntil = differenceInDays(startDateNormalized, today);
  
  if (daysUntil > 0) {
    statusText = `还有 ${daysUntil} 天出发`;
  } else if (today >= startDateNormalized && today <= endDateNormalized) {
    statusText = '进行中';
  } else {
    statusText = '已完成';
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-zinc-950 pb-20">

      {/* Hero Header */}
      <div className="relative bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200 to-cyan-200 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Status Pill */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                <span className={cn("inline-block w-2 h-2 rounded-full", {
                  "bg-blue-500": daysUntil > 0,
                  "bg-green-500": daysUntil <= 0 && today <= endDateNormalized,
                  "bg-gray-400": today > endDateNormalized
                })} />
                {statusText}
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white">
                {plan.title}
              </h1>
              {plan.description && (
                <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-light">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm text-sm font-medium">
                <CalendarIcon className="w-4 h-4 text-pink-500" />
                <span>{format(startDate, 'yyyy年M月d日')}</span>
                {plan.endDate && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <span>{format(endDate, 'M月d日')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-20">
          {plan.days.map((day, index) => (
            <motion.div 
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Day Header - Floating Sticky */}
              <div className="sticky top-4 z-20 mb-8 bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur py-2 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent">
               <div className="flex items-baseline gap-4 border-b border-gray-200 dark:border-zinc-800 pb-2">
                 <h2 className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                   Day {String(index + 1).padStart(2, '0')}
                 </h2>
                 <div className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                   {format(parseISO(day.date), 'M.d EEEE', { locale: zhCN })}
                 </div>
                 {day.theme && (
                   <span className="ml-auto text-sm font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-3 py-1 rounded-full">
                     {day.theme}
                   </span>
                 )}
               </div>
              </div>

              {/* Activities List - Grid Layout */}
              <div className="space-y-4 max-w-4xl mx-auto">
                {day.activities.length === 0 ? (
                  <div className="py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 text-center text-gray-400">
                    这一天暂时安排自由活动 😴
                  </div>
                ) : (
                  day.activities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all hover:border-pink-100 dark:hover:border-pink-900/30"
                    >
                      {/* Time Column - Fixed Width for alignment */}
                      <div className="flex-shrink-0 w-20 pt-1">
                        {activity.time ? (
                          <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-bold font-mono tracking-wide">
                            {activity.time}
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-2.5 py-1 text-gray-300 dark:text-zinc-700 text-sm font-mono tracking-wide select-none">
                            --:--
                          </div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {activity.title}
                          </h3>
                          {/* Cost or other badges could go here */}
                        </div>
                        
                        {(activity.location || activity.notes) && (
                          <div className="space-y-2">
                             {activity.location && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                  <span>{activity.location}</span>
                                </div>
                             )}
                             
                             {activity.notes && (
                               <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3 leading-relaxed mt-2">
                                 {activity.notes}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

