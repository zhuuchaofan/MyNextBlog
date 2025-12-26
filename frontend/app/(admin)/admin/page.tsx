'use client'; // 标记为客户端组件，因为需要使用 Hooks 和处理用户交互

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Settings, MessageSquare, Layers, Trash2, PenSquare } from 'lucide-react';
import Link from 'next/link';

// 管理后台首页 (Admin Dashboard)
// --------------------------------------------------------------------------------
// 这是管理员登录后看到的第一个页面，提供了各个管理功能的快捷入口。
export default function AdminDashboard() {
  const { user, isLoading } = useAuth(); // 获取全局用户状态
  const router = useRouter(); // 获取路由实例，用于跳转

  // **权限检查 (客户端保护)**
  // 虽然 middleware.ts 已经做了路由保护，但在组件内部再次检查用户角色是一个双重保险。
  // 特别是对于 'Admin' 角色的检查，因为 middleware 可能只检查了是否有 token。
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // 未登录，跳转到登录页
        router.push('/login');
      } else if (user.role !== 'Admin') {
        // 已登录但不是管理员，跳转回首页
        router.push('/'); 
      }
    }
  }, [user, isLoading, router]); // 依赖项变化时重新执行检查

  // 在加载权限或用户未就绪时，显示加载提示
  if (isLoading || !user) {
    return <div className="flex justify-center py-20">加载权限中...</div>;
  }

  // 渲染仪表盘布局
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">管理后台</h1>
      
      {/* 使用 Grid 布局展示功能卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        {/* 卡片 1: 写新文章 */}
        <Link href="/admin/posts/new" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500 h-full dark:bg-zinc-900 dark:border-zinc-800 dark:border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">写新文章</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">撰写文章</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">支持 Markdown 编辑与图片上传</p>
              <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white pointer-events-none">开始写作</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 2: 内容管理 */}
        <Link href="/admin/posts" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">内容管理</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">管理文章</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">修改、隐藏或删除现有文章</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">查看列表</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 3: 评论管理 */}
        <Link href="/admin/comments" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">评论管理</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">评论审核</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">审核、删除用户评论</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">管理评论</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 4: 系列管理 */}
        <Link href="/admin/series" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">系列管理</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">文章系列</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">创建和管理文章系列</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">管理系列</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 5: 内容配置 */}
        <Link href="/admin/settings/content" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">内容配置</CardTitle>
              <PenSquare className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">页面内容</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">编辑主页、关于页介绍文字</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">编辑内容</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 6: 系统设置 */}
        <Link href="/settings" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">系统设置</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">偏好设置</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">分类管理、友链设置等</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">进入设置</Button>
            </CardContent>
          </Card>
        </Link>

        {/* 卡片 7: 回收站 */}
        <Link href="/admin/trash" className="block h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">回收站</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-gray-100">已删除文章</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">恢复或永久删除文章</p>
              <Button variant="outline" className="w-full mt-4 pointer-events-none border-gray-200 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800">查看回收站</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
