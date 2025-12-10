'use client'; // 标记为客户端组件，因为需要使用 Hooks (useState, useEffect, useRef) 和处理文件上传

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // 导入认证上下文钩子，用于获取和更新用户状态
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // shadcn/ui Avatar 组件
import { toast } from "sonner"; // Toast 通知组件
import { uploadAvatar } from "@/lib/api"; // 导入上传头像的 API 函数
import { Loader2, Upload } from "lucide-react"; // 图标库

/**
 * SettingsPage 组件：个人设置页面
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，允许管理员查看和更新个人信息，特别是更换头像。
 */
export default function SettingsPage() {
  const { user, updateUser, isLoading } = useAuth(); // 获取用户状态和更新用户信息的函数
  const router = useRouter(); // Next.js 路由实例
  const [uploading, setUploading] = useState(false); // 控制头像上传的加载状态
  const fileInputRef = useRef<HTMLInputElement>(null); // 用于引用隐藏的文件输入框

  // **权限检查和重定向**
  // 如果用户未登录且加载完成，则重定向到登录页。
  // 注意：虽然 middleware 已经保护了 /admin 路由，这里的检查是为了在客户端进行即时反馈。
  if (!isLoading && !user) {
    router.push('/login');
    return null; // 阻止渲染，等待重定向
  }

  // 加载用户信息时显示加载动画
  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  // 处理文件选择和上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // 获取用户选择的文件
    if (!file) return; // 如果没有选择文件，则直接返回

    // 1. **文件类型验证**
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 2. **文件大小验证 (最大 5MB)**
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploading(true); // 开始上传，显示加载状态
      const res = await uploadAvatar(file); // 调用 API 上传文件

      if (res.success) {
        toast.success('头像更新成功！'); // 上传成功通知
        // 更新全局用户状态中的头像 URL，这样 Navbar 等组件会自动更新头像显示
        updateUser({
          ...user!, // 使用非空断言，因为在此处 `user` 必然存在
          avatarUrl: res.avatarUrl
        });
      } else {
        toast.error('上传失败'); // 上传失败通知
      }
    } catch (error) {
      console.error(error);
      toast.error('上传出错，请重试'); // 捕获并处理网络错误
    } finally {
      setUploading(false); // 结束上传状态
      // 清空文件输入框，以便用户可以再次选择相同文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>个人设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="flex flex-col items-center gap-6">
            {/* 用户头像显示 */}
            <Avatar className="w-32 h-32 border-4 border-orange-100 shadow-lg">
              {/* 如果用户有自定义头像，则显示；否则使用 DiceBear 生成的默认头像 */}
              <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="object-cover" />
              {/* 如果头像加载失败，显示用户名的首字母 */}
              <AvatarFallback className="text-4xl">{user?.username?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* 用户名和角色信息 */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.username}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role === 'Admin' ? '管理员' : '普通用户'}</p>
            </div>

            {/* 更换头像按钮和隐藏的文件输入框 */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <Button 
                variant="outline" 
                className="w-full relative overflow-hidden" 
                disabled={uploading} // 上传中禁用按钮
                onClick={() => fileInputRef.current?.click()} // 点击按钮时触发文件选择
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // 上传中显示加载动画
                ) : (
                  <Upload className="mr-2 h-4 w-4" /> // 否则显示上传图标
                )}
                {uploading ? '上传中...' : '更换头像'}
              </Button>
              {/* 隐藏的文件输入框，用于选择文件 */}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" // 只接受图片文件
                onChange={handleFileChange} // 文件选择后触发处理函数
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">支持 JPG, PNG, GIF. 最大 5MB.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}