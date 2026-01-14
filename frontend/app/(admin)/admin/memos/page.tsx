'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchMemosAdmin, 
  createMemo, 
  updateMemo, 
  deleteMemo,
  type MemoAdmin 
} from '@/lib/api';
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Pencil, Trash2, Loader2, MessageCircle,
  Eye, EyeOff, RefreshCw
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
import { PageContainer, EmptyState } from "@/components/common";

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<MemoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // 表单状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<MemoAdmin | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    isPublic: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMemosAdmin(page, pageSize);
      setMemos(data.memos);
      setTotalCount(data.totalCount);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingMemo(null);
    setFormData({ content: '', isPublic: true });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (memo: MemoAdmin) => {
    setEditingMemo(memo);
    setFormData({
      content: memo.content,
      isPublic: memo.isPublic,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error("内容不能为空");
      return;
    }

    setSubmitting(true);
    try {
      if (editingMemo) {
        await updateMemo(editingMemo.id, {
          content: formData.content.trim(),
          isPublic: formData.isPublic,
        });
        toast.success("动态已更新");
      } else {
        await createMemo({
          content: formData.content.trim(),
          isPublic: formData.isPublic,
        });
        toast.success("动态已发布");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteMemo(id);
      toast.success("动态已删除");
      setMemos(prev => prev.filter(m => m.id !== id));
      setTotalCount(prev => prev - 1);
    } catch {
      toast.error("删除失败");
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <PageContainer variant="admin" maxWidth="4xl">
      <AdminPageHeader
        title="动态管理"
        icon={<MessageCircle className="w-5 h-5 text-purple-500" />}
        description="发布和管理个人动态、想法和碎片记录"
        loading={loading}
        stats={
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            共 {totalCount} 条
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">刷新</span>
            </Button>
            <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">发布动态</span>
            </Button>
          </>
        }
      />

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
        </div>
      ) : memos.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-12 h-12" />}
          title="暂无动态"
          description="发布您的第一条动态"
          action={
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" />发布动态
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {memos.map(memo => (
              <Card key={memo.id} className={`border ${
                memo.isPublic 
                  ? 'border-gray-100 dark:border-zinc-800' 
                  : 'border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-900/10'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap line-clamp-3">
                        {memo.content}
                      </p>
                      
                      {/* 图片预览 */}
                      {memo.imageUrls.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {memo.imageUrls.slice(0, 4).map((url, i) => (
                            <div key={i} className="w-12 h-12 rounded bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {memo.imageUrls.length > 4 && (
                            <div className="w-12 h-12 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-gray-500">
                              +{memo.imageUrls.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 元信息 */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <span>{formatTime(memo.createdAt)}</span>
                        <Badge variant="outline" className="py-0 h-5">
                          {memo.source}
                        </Badge>
                        {!memo.isPublic && (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 py-0 h-5">
                            <EyeOff className="w-3 h-3 mr-1" /> 私密
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作 */}
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(memo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除动态？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(memo.id)} className="bg-red-500 hover:bg-red-600">
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="px-4 py-2 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingMemo ? '编辑动态' : '发布动态'}</DialogTitle>
            <DialogDescription>
              {editingMemo ? '修改动态内容' : '发布一条新的动态'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="有什么想说的..."
                rows={5}
                maxLength={2000}
                required
              />
              <p className="text-xs text-gray-400 text-right">
                {formData.content.length} / 2000
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.isPublic ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-yellow-500" />
                )}
                <Label htmlFor="isPublic">
                  {formData.isPublic ? '公开' : '私密'}
                </Label>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingMemo ? '保存' : '发布'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
