// ============================================================================
// app/(public)/memos/page.tsx - Memo 动态页面
// ============================================================================
// 展示所有公开的 Memo，支持无限滚动加载。

import { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { MemoList } from './_components/MemoList';
import { PageContainer } from '@/components/common';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '碎碎念',
  description: '随手记录的生活片段',
};

// Memo 类型定义
interface Memo {
  id: number;
  content: string;
  imageUrls: string[];
  source: string;
  createdAt: string;
}

// 获取初始数据 (Server-Side)
async function getInitialMemos(): Promise<{
  items: Memo[];
  nextCursor: string | null;
}> {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  try {
    const res = await fetch(`${backendUrl}/api/memos?limit=20`, {
      next: { revalidate: 60 } // ISR 缓存 1 分钟
    });
    
    if (!res.ok) return { items: [], nextCursor: null };
    
    const json = await res.json();
    if (!json.success) return { items: [], nextCursor: null };
    
    return { items: json.data, nextCursor: json.nextCursor };
  } catch (error) {
    console.error('Failed to fetch memos:', error);
    return { items: [], nextCursor: null };
  }
}

export default async function MemosPage() {
  const { items, nextCursor } = await getInitialMemos();

  return (
    <PageContainer variant="public" maxWidth="2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <MessageCircle className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          碎碎念
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          随手记录的生活片段，不成体系的想法
        </p>
      </div>

      {/* Memo List */}
      <MemoList initialMemos={items} initialCursor={nextCursor} />
    </PageContainer>
  );
}
