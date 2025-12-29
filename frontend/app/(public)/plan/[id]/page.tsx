'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPublicPlanById, type PublicPlanDetail } from '@/lib/api';
import { format, differenceInDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, Calendar as CalendarIcon, Heart, Plane, ArrowRight } from 'lucide-react';
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
  const today = new Date();
  
  // 计算状态
  let statusText = '';
  const daysUntil = differenceInDays(startDate, today);
  
  if (daysUntil > 0) {
    statusText = `还有 ${daysUntil} 天出发`;
  } else if (today >= startDate && today <= endDate) {
    statusText = '进行中';
  } else {
    statusText = '已完成';
  }

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-zinc-950 pb-20">

      {/* Hero Header */}
      <div className="relative bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200 to-cyan-200 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
              <span className={cn("inline-block w-2 h-2 rounded-full", {
                "bg-blue-500": daysUntil > 0,
                "bg-green-500": daysUntil <= 0 && today <= endDate,
                "bg-gray-400": today > endDate
              })} />
              {statusText}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {plan.title}
            </h1>

            {plan.description && (
              <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
                {plan.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-4 py-2 rounded-xl">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span>{format(startDate, 'yyyy年M月d日')}</span>
                {plan.endDate && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <span>{format(endDate, 'M月d日')}</span>
                  </>
                )}
              </div>
              {/* <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-4 py-2 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span>目的地</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-12">
          {plan.days.map((day, index) => (
            <motion.div 
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-0"
            >
              {/* Day Header - Mobile: Left Border, Desktop: Center aligned or specific style */}
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Date Column */}
                <div className="md:w-48 flex-shrink-0 md:text-right sticky top-4 self-start">
                  <div className="flex items-center md:justify-end gap-3 mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                      Day {index + 1}
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800 md:hidden" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {format(parseISO(day.date), 'M月d日 EEEE', { locale: zhCN })}
                  </div>
                  {day.theme && (
                    <div className="mt-2 inline-block px-3 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 rounded-lg text-sm font-medium">
                      {day.theme}
                    </div>
                  )}
                </div>

                {/* Timeline Line (Desktop only basic logic) */}
                <div className="hidden md:block w-px bg-gray-200 dark:bg-zinc-800 relative mx-4">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-500 rounded-full ring-4 ring-white dark:ring-zinc-950" />
                </div>

                {/* Activities Column */}
                <div className="flex-1 space-y-6">
                  {day.activities.length === 0 ? (
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 border border-dashed border-gray-200 dark:border-zinc-800 text-center text-gray-400">
                      这一天暂时安排自由活动 😴
                    </div>
                  ) : (
                    day.activities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="group bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                            {activity.time ? (
                              <div className="text-center">
                                <div className="text-xs font-bold leading-none">{activity.time.split(':')[0]}</div>
                                <div className="text-[10px] opacity-70 leading-none mt-0.5">{activity.time.split(':')[1]}</div>
                              </div>
                            ) : (
                              <Plane className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {activity.title}
                            </h3>
                            
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {activity.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {activity.location}
                                </span>
                              )}

                            </div>

                            {activity.notes && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3 leading-relaxed">
                                {activity.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
