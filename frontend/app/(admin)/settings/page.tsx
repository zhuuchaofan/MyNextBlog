'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/api";
import { Loader2, Upload } from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadAvatar(file);
      
      if (res.success) {
        toast.success('头像更新成功！');
        updateUser({
          ...user!,
          avatarUrl: res.avatarUrl
        });
      } else {
        toast.error('上传失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('上传出错，请重试');
    } finally {
      setUploading(false);
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
            <Avatar className="w-32 h-32 border-4 border-orange-100 shadow-lg">
              <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="object-cover" />
              <AvatarFallback className="text-4xl">{user?.username?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
              <p className="text-sm text-gray-500">{user?.role === 'Admin' ? '管理员' : '普通用户'}</p>
            </div>

            <div className="flex items-center gap-4 w-full max-w-xs">
              <Button 
                variant="outline" 
                className="w-full relative overflow-hidden" 
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? '上传中...' : '更换头像'}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-gray-400">支持 JPG, PNG, GIF. 最大 5MB.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}