'use client';

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchAllSeries, createSeries, deleteSeries, updateSeries, Series } from '@/lib/api';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function SeriesManagementPage() {
//   const router = useRouter();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该系列吗？相关的文章不会被删除，但会解除与该系列的关联。')) return;

    try {
      const res = await deleteSeries(id);
      if (res.success) {
         toast.success('删除成功');
         setSeriesList(seriesList.filter(s => s.id !== id));
      } else {
         toast.error(res.message);
      }
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold dark:text-white">系列管理</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
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

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[100px] text-center">文章数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={4} className="h-24 text-center">
                   <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                   </div>
                 </TableCell>
               </TableRow>
            ) : seriesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                  暂无系列数据
                </TableCell>
              </TableRow>
            ) : (
              seriesList.map(series => (
                <TableRow key={series.id}>
                  <TableCell className="font-medium">{series.name}</TableCell>
                  <TableCell className="text-gray-500">{series.description || '-'}</TableCell>
                  <TableCell className="text-center">{series.postCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(series)}>
                        <Edit className="w-4 h-4 text-gray-500 hover:text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(series.id)}>
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
    </div>
  );
}
