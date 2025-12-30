'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { uploadAvatar, updateProfile } from "@/lib/api";
import { Loader2, Upload, Save, User as UserIcon, Globe, Mail, Pencil, X, ChevronLeft, MapPin, Briefcase, Calendar } from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 新增：编辑模式状态
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    bio: '',
    website: '',
    location: '',
    occupation: '',
    birthDate: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        nickname: user.nickname || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || '',
        occupation: user.occupation || '',
        birthDate: user.birthDate || ''
      });
    }
  }, [user]);

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
        updateUser({ ...user!, avatarUrl: res.avatarUrl });
      } else {
        toast.error('上传失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('上传出错');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
          // Convert empty strings to undefined for optional fields
          const payload = {
            ...formData,
            birthDate: formData.birthDate === '' ? undefined : formData.birthDate
          };

          const res = await updateProfile(payload);
          if (res.success) {
              toast.success("个人资料已更新");
              updateUser({ ...user!, ...formData });
              setIsEditing(false); // 保存后退出编辑模式
          } else {
              toast.error(res.message || "更新失败");
          }
      } catch {
          toast.error("网络错误");
      } finally {
          setSaving(false);
      }
  };

  const handleCancel = () => {
      setIsEditing(false);
      // 重置表单为当前用户数据
      if (user) {
        setFormData({
            email: user.email || '',
            nickname: user.nickname || '',
            bio: user.bio || '',
            website: user.website || '',
            location: user.location || '',
            occupation: user.occupation || '',
            birthDate: user.birthDate || ''
        });
      }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">账号设置</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle>我的头像</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Avatar className="w-32 h-32 border-4 border-orange-100 dark:border-orange-900/30 shadow-lg">
                        <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="object-cover" />
                        <AvatarFallback className="text-4xl">{user?.username?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.nickname || user?.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    </div>

                    <div className="w-full">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            更换头像
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        <p className="text-xs text-center text-gray-400 mt-2">支持 JPG, PNG. 最大 5MB</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Profile Form */}
        <div className="md:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>个人资料</CardTitle>
                        <CardDescription>管理您的公开信息和联系方式</CardDescription>
                    </div>
                    {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="w-4 h-4 mr-2" /> 编辑
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nickname" className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-gray-500" /> 昵称 (显示名)
                            </Label>
                            <Input 
                                id="nickname" 
                                placeholder="例如：技术宅" 
                                value={formData.nickname}
                                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">个人简介</Label>
                            <Textarea 
                                id="bio" 
                                placeholder="写一句话介绍你自己..." 
                                className="resize-none h-24"
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" /> 邮箱地址
                                </Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="your@email.com" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    disabled={!isEditing}
                                />
                                <p className="text-xs text-gray-500">用于接收评论通知</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website" className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" /> 个人网站
                                </Label>
                                <Input 
                                    id="website" 
                                    placeholder="https://example.com" 
                                    value={formData.website}
                                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" /> 所在地
                                </Label>
                                <Input 
                                    id="location" 
                                    placeholder="例如：北京, 中国" 
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="occupation" className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500" /> 职业
                                </Label>
                                <Input 
                                    id="occupation" 
                                    placeholder="例如：全栈开发者" 
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthDate" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" /> 出生日期
                                </Label>
                                <Input 
                                    id="birthDate" 
                                    type="date"
                                    value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    <X className="w-4 h-4 mr-2" /> 取消
                                </Button>
                                <Button type="submit" disabled={saving} className="min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white">
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    保存更改
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
