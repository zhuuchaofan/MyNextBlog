'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchRelatedPosts } from '@/lib/api';
import { Calendar, Tag } from 'lucide-react';

interface RelatedPost {
  id: number;
  title: string;
  excerpt: string;
  categoryName: string;
  createTime: string;
}

interface RelatedPostsProps {
  postId: number;
  count?: number;
}

/**
 * 相关文章推荐组件
 * 显示与当前文章相关的推荐文章列表
 */
export default function RelatedPosts({ postId, count = 4 }: RelatedPostsProps) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedPosts(postId, count)
      .then(res => {
        if (res.success && res.data) {
          setPosts(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, count]);

  // 没有相关文章时不显示
  if (!loading && posts.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">相关推荐</h2>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 dark:bg-zinc-800 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* 文章卡片网格 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(post => (
            <Link 
              key={post.id} 
              href={`/posts/${post.id}`}
              className="group block"
            >
              <article className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 h-full transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-0.5">
                {/* 分类标签 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    <Tag className="w-3 h-3" />
                    {post.categoryName}
                  </span>
                </div>

                {/* 标题 */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h3>

                {/* 发布时间 */}
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <time>{new Date(post.createTime).toLocaleDateString()}</time>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
