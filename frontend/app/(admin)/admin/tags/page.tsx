'use client';

// ============================================================================
// 标签管理页面
// ============================================================================
// 管理员可以在此页面创建、编辑、删除文章标签。
// UI 规范与其他管理页面保持一致。

import { useState, useEffect } from 'react';
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 标签类型定义
interface TagItem {
  id: number;
  name: string;
  postCount: number;
}

// API 函数
async function fetchTags(): Promise<{ success: boolean; data: TagItem[] }> {
  const res = await fetch('/api/backend/tags');
  return res.json();
}

async function createTag(name: string): Promise<{ success: boolean; data?: TagItem; message?: string }> {
  const res = await fetch('/api/backend/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

async function updateTag(id: number, name: string): Promise<{ success: boolean; data?: TagItem; message?: string }> {
  const res = await fetch(`/api/backend/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

async function deleteTag(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/backend/tags/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export default function TagsManagementPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const res = await fetchTags();
      if (res.success) {
        setTags(res.data);
      }
    } catch {
      toast.error('加载标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.warning('名称不能为空');
    if (name.trim().length > 20) return toast.warning('名称不能超过20个字符');
    
    try {
      const res = await createTag(name);
      if (res.success && res.data) {
        toast.success('创建成功');
        setTags([...tags, res.data]);
        setIsCreateOpen(false);
        setName('');
      } else {
        toast.error(res.message || '创建失败');
      }
    } catch {
      toast.error('创建失败');
    }
  };

  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setName(tag.name);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTag) return;
    if (!name.trim()) return toast.warning('名称不能为空');
    if (name.trim().length > 20) return toast.warning('名称不能超过20个字符');

    try {
      const res = await updateTag(editingTag.id, name);
      if (res.success && res.data) {
        toast.success('更新成功');
        setTags(tags.map(t => t.id === editingTag.id ? res.data! : t));
        setIsEditOpen(false);
        setEditingTag(null);
        setName('');
      } else {
        toast.error(res.message || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await deleteTag(deleteTarget.id);
      if (res.success) {
         toast.success('删除成功');
         setTags(tags.filter(t => t.id !== deleteTarget.id));
      } else {
         toast.error(res.message || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 头部导航 */}
      <AdminPageHeader
        title="标签管理"
        icon={<Tag className="w-5 h-5 text-blue-500" />}
        loading={loading}
        stats={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Tag className="w-3.5 h-3.5" />
            共 {tags.length} 个
          </span>
        }
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">新建标签</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建标签</DialogTitle>
                <DialogDescription>创建一个新的文章标签。名称最多 20 个字符。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input value={name} maxLength={20} onChange={e => setName(e.target.value)} placeholder="例如：Docker" />
                  <p className="text-xs text-gray-500">{name.length}/20</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* 内容区域 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[300px]">
        
        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <TableHead className="w-[50%]">名称</TableHead>
                <TableHead className="w-[25%] text-center">使用次数</TableHead>
                <TableHead className="w-[25%] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={3} className="h-40 text-center text-gray-500">
                     <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
                     </div>
                   </TableCell>
                 </TableRow>
              ) : tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center text-gray-500">
                    暂无标签数据
                  </TableCell>
                </TableRow>
              ) : (
                tags.map(tag => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-200 truncate" title={tag.name}>
                      <span className="text-gray-400 mr-1">#</span>{tag.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-800">
                        {tag.postCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)} className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(tag)} className="h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">加载中...</span>
             </div>
          ) : tags.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                暂无标签数据
             </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {tags.map(tag => (
                <div key={tag.id} className="p-4">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                             <span className="font-bold text-gray-900 dark:text-gray-200 truncate">
                               <span className="text-gray-400 mr-1">#</span>{tag.name}
                             </span>
                             <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-zinc-800 ml-2 flex-shrink-0">
                               {tag.postCount} 次
                             </Badge>
                          </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
                       <Button 
                           size="sm" 
                           variant="ghost" 
                           className="h-8 px-3 text-xs text-blue-500"
                           onClick={() => handleEdit(tag)}
                       >
                           <Edit className="w-3 h-3 mr-1" /> 编辑
                       </Button>
                       <Button 
                           size="sm" 
                           variant="ghost" 
                           className="h-8 px-3 text-xs text-red-500"
                            onClick={() => setDeleteTarget(tag)}
                        >
                            <Trash2 className="w-3 h-3 mr-1" /> 删除
                        </Button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑标签</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={name} maxLength={20} onChange={e => setName(e.target.value)} />
                <p className="text-xs text-gray-500">{name.length}/20</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    {/* Delete Alert Dialog */}
    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定删除标签 &quot;{deleteTarget?.name}&quot; 吗？</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.postCount && deleteTarget.postCount > 0 
              ? `该标签被 ${deleteTarget.postCount} 篇文章使用，无法删除。请先从文章中移除此标签。`
              : "此操作无法撤销。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-red-500 hover:bg-red-600"
            disabled={deleteTarget?.postCount ? deleteTarget.postCount > 0 : false}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
