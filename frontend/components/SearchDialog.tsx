'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // 跳转到搜索结果页
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    
    // 关闭弹窗
    onOpenChange(false);
    setQuery(''); // 可选：清空搜索框，或者保留上次的搜索词
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] top-[20%] translate-y-0 bg-white">
        <DialogHeader>
          <DialogTitle>搜索文章</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="输入关键词..." 
              className="pl-10" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // 注意：Dialog 中的 autoFocus 有时会有问题，这里尝试加上
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!query.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
            搜索
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}