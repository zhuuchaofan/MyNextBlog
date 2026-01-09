'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { type Memo } from '@/lib/api';

interface MemoCardProps {
  memo: Memo;
}

/**
 * Memo 卡片组件
 * - 文本内容 + 九宫格图片布局
 * - 点击图片可放大
 */
export function MemoCard({ memo }: MemoCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // 格式化相对时间
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };
  
  // 根据图片数量动态调整布局
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-xs';
    if (count === 2) return 'grid-cols-2 max-w-sm';
    if (count <= 4) return 'grid-cols-2 max-w-sm';
    return 'grid-cols-3 max-w-md';
  };

  return (
    <div className="p-5 border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
      {/* 文本内容 */}
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {memo.content}
      </p>
      
      {/* 图片九宫格 */}
      {memo.imageUrls.length > 0 && (
        <div className={`grid ${getGridClass(memo.imageUrls.length)} gap-2 mt-3`}>
          {memo.imageUrls.slice(0, 9).map((url, i) => (
            <div 
              key={i} 
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer hover:opacity-90 transition-opacity relative"
              onClick={() => setLightboxIndex(i)}
            >
              <Image
                src={url}
                alt={`图片 ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 150px"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* 元信息 */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{formatRelativeTime(memo.createdAt)}</span>
        {memo.source !== 'Web' && (
          <Badge variant="outline" className="text-xs py-0 h-5">
            {memo.source}
          </Badge>
        )}
      </div>
      
      {/* 简易 Lightbox */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={memo.imageUrls[lightboxIndex]}
              alt="放大预览"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button 
            className="absolute top-4 right-4 text-white text-2xl hover:opacity-70"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
