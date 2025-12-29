'use client';

import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * useTocHighlight - 目录高亮自定义 Hook
 * 
 * 监听滚动事件，返回当前可见章节的 ID
 * 
 * @param toc - 目录项数组，包含 id、text、level
 * @param offset - 视口顶部偏移量（默认 150px，考虑导航栏高度）
 * @returns activeId - 当前激活的目录项 ID
 */
export function useTocHighlight(toc: TocItem[], offset = 150): string {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (toc.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        // 获取所有标题元素的实时位置
        const headingPositions = toc
          .map(item => {
            const el = document.getElementById(item.id);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { id: item.id, top: rect.top };
          })
          .filter(Boolean) as { id: string; top: number }[];

        // 找"已滚过视口顶部"的最后一个标题
        let currentId = headingPositions[0]?.id || '';
        
        for (const { id, top } of headingPositions) {
          if (top <= offset) {
            currentId = id;
          } else {
            break;
          }
        }
        
        setActiveId(currentId);
        ticking = false;
      });
    };

    // 初始化时执行一次
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc, offset]);

  return activeId;
}
