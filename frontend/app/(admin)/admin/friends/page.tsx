'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  fetchFriendLinksAdmin, 
  createFriendLink, 
  updateFriendLink, 
  deleteFriendLink,
  type FriendLinkAdmin 
} from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, Plus, Pencil, Trash2, Loader2, Link as LinkIcon, 
  ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminFriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendLinkAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 表单状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<FriendLinkAdmin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    avatarUrl: '',
    displayOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFriendLinksAdmin();
      setFriends(data);
    } catch {
      toast.error("加载友链失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingFriend(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      avatarUrl: '',
      displayOrder: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (friend: FriendLinkAdmin) => {
    setEditingFriend(friend);
    setFormData({
      name: friend.name,
      url: friend.url,
      description: friend.description || '',
      avatarUrl: friend.avatarUrl || '',
      displayOrder: friend.displayOrder,
      isActive: friend.isActive,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error("名称和 URL 不能为空");
      return;
    }

    setSubmitting(true);
    try {
      if (editingFriend) {
        // 更新
        await updateFriendLink(editingFriend.id, {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        });
        toast.success("友链已更新");
      } else {
        // 创建
        await createFriendLink({
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          displayOrder: formData.displayOrder,
        });
        toast.success("友链已创建");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除友链
  const handleDelete = async (id: number) => {
    try {
      await deleteFriendLink(id);
      toast.success("友链已删除");
      setFriends(prev => prev.filter(f => f.id !== id));
    } catch {
      toast.error("删除失败");
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            友链管理
          </h1>
          {!loading && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
              共 {friends.length} 个
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" /> 添加友链
          </Button>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
          <LinkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无友链</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" /> 添加第一个友链
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map(friend => (
            <Card key={friend.id} className={`relative overflow-hidden border ${
              friend.isActive 
                ? 'border-gray-100 dark:border-zinc-800' 
                : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50'
            }`}>
              {/* 状态指示 */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {friend.lastCheckTime ? (
                  // 已进行过健康检查
                  friend.isOnline ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                      在线{friend.latencyMs !== null && friend.latencyMs !== undefined ? ` ${friend.latencyMs}ms` : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-500 dark:text-red-400 text-xs border-red-200 dark:border-red-800">
                      离线
                    </Badge>
                  )
                ) : (
                  // 尚未进行健康检查
                  <Badge variant="outline" className="text-gray-500 dark:text-gray-400 text-xs">
                    待检查
                  </Badge>
                )}
                {!friend.isActive && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">
                    已禁用
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white dark:border-zinc-700">
                    <AvatarImage src={friend.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friend.name)}`} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {friend.name}
                      </h3>
                      <span className="text-xs text-gray-400">#{friend.displayOrder}</span>
                    </div>
                    <a 
                      href={friend.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate"
                    >
                      {friend.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {friend.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                        {friend.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      最后检查: {formatTime(friend.lastCheckTime)}
                    </p>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(friend)}>
                    <Pencil className="w-4 h-4 mr-1" /> 编辑
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 mr-1" /> 删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除友链？</AlertDialogTitle>
                        <AlertDialogDescription>
                          将删除 &quot;{friend.name}&quot;，此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(friend.id)} className="bg-red-500 hover:bg-red-600">
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingFriend ? '编辑友链' : '添加友链'}</DialogTitle>
            <DialogDescription>
              {editingFriend ? '修改友链信息' : '添加一个新的友情链接'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">站点名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：张三的博客"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">站点 URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简短的站点介绍"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">头像 URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={formData.avatarUrl}
                onChange={e => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">排序</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={e => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              {editingFriend && (
                <div className="flex items-center justify-between pt-6">
                  <Label htmlFor="isActive">启用</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingFriend ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
