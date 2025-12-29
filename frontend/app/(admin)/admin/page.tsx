'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PenSquare, 
  FileText, 
  MessageSquare, 
  Layers, 
  Settings, 
  Trash2,
  ChevronRight,
  Sparkles,
  Mail,
  CalendarDays
} from 'lucide-react';
// 统计数据类型定义
interface DashboardStats {
  posts: {
    total: number;
    published: number;
    draft: number;
  };
}

/**
 * AdminDashboard - 管理后台首页
 * 布局: Hero 卡片 + 统计 Widget + 功能分组
 */
export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // 统计数据状态 - Hero 卡片展示核心统计
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // 权限检查
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'Admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // 统一获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Loading 骨架屏 - 避免内容闪烁
  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-gray-100 dark:bg-zinc-800 rounded-xl"></div>
            <div className="h-48 bg-gray-100 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // 功能分组数据
  const contentLinks = [
    { href: '/admin/posts', icon: FileText, label: '文章管理', desc: '编辑、隐藏或删除文章' },
    { href: '/admin/comments', icon: MessageSquare, label: '评论管理', desc: '审核用户评论' },
    { href: '/admin/series', icon: Layers, label: '系列管理', desc: '创建和管理文章系列' },
    { href: '/admin/settings/anniversaries', icon: Sparkles, label: '纪念日', desc: '管理首页纪念日挂件' },
    { href: '/admin/plans', icon: CalendarDays, label: '计划管理', desc: '行程规划、预算追踪' },
  ];

  const systemLinks = [
    { href: '/admin/settings/content', icon: PenSquare, label: '内容配置', desc: '编辑主页、关于页介绍' },
    { href: '/admin/settings/email-templates', icon: Mail, label: '邮件模板', desc: '自定义系统邮件内容' },
    { href: '/settings', icon: Settings, label: '系统设置', desc: '分类管理、友链设置' },
    { href: '/admin/trash', icon: Trash2, label: '回收站', desc: '恢复或永久删除文章' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      
      {/* Hero 卡片 - 写新文章入口 + 核心统计 */}
      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-zinc-900 dark:to-zinc-900 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">管理后台</h1>
              </div>
              {stats && (
                <p className="text-gray-600 dark:text-gray-400">
                  已发布 <span className="font-semibold text-green-600 dark:text-green-400">{stats.posts.published}</span> 篇 · 
                  草稿 <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.posts.draft}</span> 篇
                </p>
              )}
            </div>
            <Link href="/admin/posts/new">
              <Button size="lg" className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                <PenSquare className="w-4 h-4 mr-2" />
                写新文章
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 功能分组 */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* 内容管理组 */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              内容管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {contentLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <link.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{link.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{link.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 系统设置组 */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-500" />
              系统设置
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {systemLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <link.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{link.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{link.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
