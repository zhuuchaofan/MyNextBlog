'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'Admin') {
        router.push('/'); // 普通用户不允许进入
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex justify-center py-20">加载权限中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">管理后台</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* 快捷操作卡片 */}
        <Link href="/admin/posts/new" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500 h-full dark:bg-zinc-900 dark:border-zinc-800 dark:border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">写新文章</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">Create Post</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">支持 Markdown 编辑与图片上传</p>
              <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white pointer-events-none">开始写作</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/posts" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">文章管理</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">Manage Content</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">修改、隐藏或删除现有文章</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">查看列表</Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">系统设置</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">Settings</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">分类管理、友链设置等</p>
            <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">进入设置</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
