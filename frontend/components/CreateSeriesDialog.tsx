'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSeries, Series } from '@/lib/api';
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface CreateSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (newSeries: Series) => void;
}

export default function CreateSeriesDialog({ open, onOpenChange, onCreated }: CreateSeriesDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await createSeries(name, description);
      if (res.success) {
        toast.success('系列创建成功');
        onCreated(res.data);
        onOpenChange(false);
        // Reset form
        setName('');
        setDescription('');
      } else {
        toast.error('创建失败: ' + res.message);
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">新建系列</DialogTitle>
          <DialogDescription className="dark:text-zinc-400">
            创建一个新的文章系列。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="series-name" className="dark:text-gray-200">系列名称</Label>
            <Input 
              id="series-name"
              placeholder="输入系列名称..." 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="series-desc" className="dark:text-gray-200">描述 (可选)</Label>
            <Input
               id="series-desc"
               placeholder="系列简介..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700">
              取消
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
