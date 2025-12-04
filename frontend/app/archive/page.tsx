'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";

interface Post {
  id: number;
  title: string;
  createTime: string;
  category: string;
}

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取所有文章 (为了归档，我们可能需要一个获取全部无分页的接口，但暂时先取第一页的 100 条作为演示)
  useEffect(() => {
    fetch('/api/backend/posts?pageSize=100')
      .then(res => res.json())
      .then(data => {
        if(data.success) setPosts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 按年份分组
  const groupedPosts = posts.reduce((acc, post) => {
    const year = new Date(post.createTime).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {} as Record<number, Post[]>);

  const sortedYears = Object.keys(groupedPosts).map(Number).sort((a, b) => b - a);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-12">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">文章归档</h1>
        <p className="text-gray-500 mt-2">共 {posts.length} 篇好文</p>
      </header>

      {loading ? (
        <div className="space-y-4 animate-pulse">
           <div className="h-8 bg-gray-100 rounded w-32 mx-auto"></div>
           <div className="h-20 bg-gray-100 rounded-xl"></div>
           <div className="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      ) : (
        <div className="relative border-l border-gray-200 ml-4 md:ml-0 pl-8 md:pl-12 space-y-12">
          {sortedYears.map(year => (
            <div key={year} className="relative">
              {/* 年份标签 */}
              <span className="absolute -left-[49px] md:-left-[65px] top-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-orange-100 text-orange-600 font-bold rounded-full border-4 border-white text-sm md:text-base">
                {year}
              </span>
              
              <div className="space-y-6 pt-20"> {/* <--- Added pt-10 here */}
                {groupedPosts[year].map(post => (
                  <div key={post.id} className="group relative">
                    <div className="absolute -left-[41px] md:-left-[57px] top-2 w-3 h-3 bg-gray-200 rounded-full group-hover:bg-orange-400 transition-colors border-2 border-white"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <Link href={`/posts/${post.id}`} className="text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors">
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-3 text-sm text-gray-400 flex-shrink-0">
                           <span>{new Date(post.createTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                           <Badge variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-500">
                             {post.category}
                           </Badge>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
