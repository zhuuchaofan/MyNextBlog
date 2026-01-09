'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategory } from '@/lib/api';
import { toast } from "sonner";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (newCategory: { id: number; name: string }) => void;
}

export default function CreateCategoryDialog({ open, onOpenChange, onCreated }: CreateCategoryDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await createCategory(name);
      if (res.success) {
        toast.success('分类创建成功');
        onCreated(res.category);
        onOpenChange(false);
        setName('');
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
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>新建分类</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input 
            placeholder="输入分类名称..." 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
