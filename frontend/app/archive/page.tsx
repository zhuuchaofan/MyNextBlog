'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, PawPrint, ArrowRight, Tag } from "lucide-react";

interface Post {
  id: number;
  title: string;
  createTime: string;
  categoryName: string;
}

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
      <header className="mb-16 text-center space-y-4">
        <div className="inline-block p-3 bg-orange-100 rounded-full mb-2">
          <PawPrint className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">时光印记</h1>
        <p className="text-gray-500">
          共收录 <span className="text-orange-600 font-bold">{posts.length}</span> 篇技术与生活随笔
        </p>
      </header>

      {loading ? (
        <div className="space-y-8 animate-pulse max-w-2xl mx-auto">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-4">
                <div className="w-24 h-6 bg-gray-100 rounded"></div>
                <div className="flex-1 h-24 bg-gray-100 rounded-xl"></div>
             </div>
           ))}
        </div>
      ) : (
        <div className="relative space-y-12 max-w-3xl mx-auto">
          {/* 中轴线 */}
          <div className="absolute left-4 md:left-1/2 top-4 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-orange-100 to-transparent -translate-x-1/2 md:block hidden"></div>
          
          {/* 移动端左侧线 */}
          <div className="absolute left-6 top-4 bottom-0 w-0.5 bg-gray-100 md:hidden"></div>

          {sortedYears.map(year => (
            <div key={year} className="relative z-10">
              {/* 年份标记 */}
              <div className="flex md:justify-center items-center mb-8">
                <div className="bg-white border-2 border-orange-200 text-orange-600 px-4 py-1 rounded-full font-bold text-lg shadow-sm z-20 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {year}
                </div>
              </div>

              <div className="space-y-8">
                {groupedPosts[year].map((post, index) => (
                  <div key={post.id} className={`flex flex-col md:flex-row items-center gap-4 md:gap-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* 1. 日期/元数据 (Desktop: Empty half or Date) */}
                    <div className="hidden md:flex w-1/2 px-8 justify-end text-right">
                       <div className={`${index % 2 === 0 ? 'text-left justify-start' : 'text-right justify-end'} w-full flex items-center text-sm text-gray-400 gap-2`}>
                          <span>{new Date(post.createTime).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                       </div>
                    </div>

                    {/* 2. 中轴节点 */}
                    <div className="absolute left-6 md:left-1/2 w-8 h-8 -translate-x-1/2 flex items-center justify-center bg-white rounded-full border border-orange-100 shadow-sm z-10 group-hover:scale-110 transition-transform">
                      <div className="w-3 h-3 bg-orange-400 rounded-full group-hover:bg-orange-500"></div>
                    </div>

                    {/* 3. 文章卡片 */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                      <Link href={`/posts/${post.id}`} className="group block">
                        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-gray-100 group-hover:border-orange-200 bg-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-orange-100"></div>
                          
                          <div className="relative z-10">
                             <div className="flex items-center justify-between mb-2">
                               <Badge variant="outline" className="text-orange-600 bg-orange-50/50 border-orange-100 font-normal flex items-center gap-1">
                                 <Tag className="w-3 h-3" /> {post.categoryName || '未分类'}
                               </Badge>
                               <span className="md:hidden text-xs text-gray-400">
                                 {new Date(post.createTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                               </span>
                             </div>
                             
                             <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
                               {post.title}
                             </h3>
                             
                             <div className="flex items-center text-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                               阅读全文 <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                             </div>
                          </div>
                        </Card>
                      </Link>
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