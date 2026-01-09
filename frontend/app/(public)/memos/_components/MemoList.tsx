'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MemoCard } from './MemoCard';
import { type Memo, fetchMemos as fetchMemosApi } from '@/lib/api';

interface MemoListProps {
  initialMemos: Memo[];
  initialCursor: string | null;
}

/**
 * Memo 列表组件 (无限滚动)
 */
export function MemoList({ initialMemos, initialCursor }: MemoListProps) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  
  // 加载更多
  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    
    try {
      const result = await fetchMemosApi(cursor);
      setMemos(prev => [...prev, ...result.items]);
      setCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load more memos:', error);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);
  
  // 滚动到底部自动加载
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !cursor) return;
      
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // 距离底部 200px 时加载
      if (scrollTop + windowHeight >= docHeight - 200) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, cursor, loadMore]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {memos.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          暂无动态
        </div>
      ) : (
        <>
          {memos.map(memo => (
            <MemoCard key={memo.id} memo={memo} />
          ))}
          
          {/* 加载更多按钮 */}
          {cursor && (
            <div className="p-4 text-center border-t border-gray-100 dark:border-zinc-800">
              <Button 
                variant="ghost" 
                onClick={loadMore} 
                disabled={loading}
                className="text-gray-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    加载中...
                  </>
                ) : (
                  '加载更多'
                )}
              </Button>
            </div>
          )}
          
          {!cursor && memos.length > 0 && (
            <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
              已经到底了 ~
            </div>
          )}
        </>
      )}
    </div>
  );
}
