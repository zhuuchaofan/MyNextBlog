'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchAllSeries, createSeries, deleteSeries, updateSeries, Series } from '@/lib/api';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, Layers } from 'lucide-react';
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

export default function SeriesManagementPage() {
  const router = useRouter();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState<Series | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const res = await fetchAllSeries();
      if (res.success) {
        setSeriesList(res.data);
      }
    } catch {
      toast.error('加载系列列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.warning('名称不能为空');
    
    try {
      const res = await createSeries(name, description);
      if (res.success) {
        toast.success('创建成功');
        setSeriesList([...seriesList, res.data]);
        setIsCreateOpen(false);
        setName('');
        setDescription('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('创建失败');
    }
  };

  const handleEdit = (series: Series) => {
    setEditingSeries(series);
    setName(series.name);
    setDescription(series.description || '');
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSeries) return;
    if (!name.trim()) return toast.warning('名称不能为空');

    try {
      const res = await updateSeries(editingSeries.id, name, description);
      if (res.success) {
        toast.success('更新成功');
        setSeriesList(seriesList.map(s => s.id === editingSeries.id ? res.data : s));
        setIsEditOpen(false);
        setEditingSeries(null);
        setName('');
        setDescription('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteSeriesTarget) return;

    try {
      const res = await deleteSeries(deleteSeriesTarget.id);
      if (res.success) {
         toast.success('删除成功');
         setSeriesList(seriesList.filter(s => s.id !== deleteSeriesTarget.id));
      } else {
         toast.error(res.message);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteSeriesTarget(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 头部导航 */}
      <div className="flex flex-col gap-4 mb-8">
        {/* 第一行：返回按钮 + 标题 + 徽章 */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">系列管理</h1>
          {!loading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Layers className="w-3.5 h-3.5" />
              共 {seriesList.length} 个
            </span>
          )}
        </div>
        {/* 第二行：新建按钮 */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> 新建系列
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建系列</DialogTitle>
              <DialogDescription>创建一个新的文章系列。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：Next.js 实战教程" />
              </div>
              <div className="space-y-2">
                <Label>描述 (可选)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="简短描述该系列的主题" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 内容区域 - 与评论管理页面风格一致 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[300px]">
        
        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="w-[100px] text-center">文章数</TableHead>
                <TableHead className="w-[120px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={4} className="h-40 text-center text-gray-500">
                     <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
                     </div>
                   </TableCell>
                 </TableRow>
              ) : seriesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-gray-500">
                    暂无系列数据
                  </TableCell>
                </TableRow>
              ) : (
                seriesList.map(series => (
                  <TableRow key={series.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-200">{series.name}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{series.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-800">
                        {series.postCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(series)} className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteSeriesTarget(series)} className="h-8 w-8 p-0">
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

        {/* Mobile View: Cards - 与评论管理页面一致 */}
        <div className="md:hidden">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">加载中...</span>
             </div>
          ) : seriesList.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                暂无系列数据
             </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {seriesList.map(series => (
                <div key={series.id} className="p-4">
                   <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                             <span className="font-bold text-gray-900 dark:text-gray-200 truncate">{series.name}</span>
                             <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-zinc-800 ml-2 flex-shrink-0">
                               {series.postCount} 篇
                             </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {series.description || '暂无描述'}
                          </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
                       <Button 
                           size="sm" 
                           variant="ghost" 
                           className="h-8 px-3 text-xs text-blue-500"
                           onClick={() => handleEdit(series)}
                       >
                           <Edit className="w-3 h-3 mr-1" /> 编辑
                       </Button>
                       <Button 
                           size="sm" 
                           variant="ghost" 
                           className="h-8 px-3 text-xs text-red-500"
                            onClick={() => setDeleteSeriesTarget(series)}
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
              <DialogTitle>编辑系列</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>描述 (可选)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    {/* Delete Alert Dialog */}
    <AlertDialog open={!!deleteSeriesTarget} onOpenChange={(open) => !open && setDeleteSeriesTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定删除系列 &quot;{deleteSeriesTarget?.name}&quot; 吗？</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteSeriesTarget?.postCount && deleteSeriesTarget.postCount > 0 
              ? `该系列包含 ${deleteSeriesTarget.postCount} 篇文章，删除后它们将变为无系列状态。`
              : "此操作无法撤销。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}
