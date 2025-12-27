'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, MessageCircle, FolderOpen, Tag, BookOpen } from 'lucide-react';

// 统计数据类型定义
export interface DashboardStats {
  posts: {
    total: number;
    published: number;
    draft: number;
  };
  comments: number;
  categories: number;
  tags: number;
  series: number;
}

// 组件 Props 定义
interface AdminStatsWidgetProps {
  stats: DashboardStats | null;
  loading: boolean;
}

/**
 * AdminStatsWidget - 受控统计卡片组件
 * 数据由父组件传入，不再内部请求
 */
export default function AdminStatsWidget({ stats, loading }: AdminStatsWidgetProps) {
  // 加载状态：显示骨架屏
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse border-gray-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-100 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 无数据时不渲染
  if (!stats) return null;

  // 统计卡片配置
  const statCards = [
    {
      title: '已发布',
      value: stats.posts.published,
      icon: Eye,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: '草稿',
      value: stats.posts.draft,
      icon: EyeOff,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: '评论总数',
      value: stats.comments,
      icon: MessageCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: '系列',
      value: stats.series,
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: '分类',
      value: stats.categories,
      icon: FolderOpen,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      title: '标签',
      value: stats.tags,
      icon: Tag,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card) => (
        <Card key={card.title} className="border-gray-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
