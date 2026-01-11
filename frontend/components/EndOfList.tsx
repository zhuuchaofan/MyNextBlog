'use client';

// components/EndOfList.tsx
// 列表到底提示组件 - 用于无限滚动和分页列表的底部提示
import { motion } from 'framer-motion';
import { Cat } from 'lucide-react';

interface EndOfListProps {
  /** 提示文案，默认为"已经到底啦～" */
  message?: string;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
}

export function EndOfList({ 
  message = '已经到底啦～', 
  showIcon = true,
  className = ''
}: EndOfListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-center gap-2 py-8 text-gray-400 dark:text-gray-500 text-sm ${className}`}
    >
      {showIcon && (
        <Cat className="w-4 h-4" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}
