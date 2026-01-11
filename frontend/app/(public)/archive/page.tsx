'use client'; // 标记为客户端组件，因为需要使用 useState 和 useEffect 来管理数据和加载状态

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, PawPrint, ArrowRight, Tag } from "lucide-react";
import { EndOfList } from "@/components/EndOfList";

// 定义文章数据的接口
interface Post {
  id: number;
  title: string;
  createTime: string;
  categoryName: string;
}

/**
 * ArchivePage 组件：文章归档页面
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，用于展示所有文章的归档列表，并按年份进行分组。
 * UI 设计为一个时间轴（Timeline）样式，响应式地适应桌面和移动设备。
 */
export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]); // 存储从后端获取的文章列表
  const [loading, setLoading] = useState(true); // 控制加载状态

  // `useEffect` 钩子，在组件首次挂载时执行一次，用于获取所有文章数据
  useEffect(() => {
    // 调用 API 获取所有文章。这里设置 `pageSize=100`，对于博客通常足够获取所有文章。
    // 如果文章数量巨大，需要实现分页加载。
    fetch('/api/backend/posts?pageSize=100') // 注意这里是公共 API，不需要认证
      .then(res => res.json())
      .then(data => {
        if(data.success) setPosts(data.data); // 如果成功，更新文章列表状态
        setLoading(false); // 加载完成
      })
      .catch(() => setLoading(false)); // 捕获错误，也结束加载状态
  }, []); // 空依赖数组表示只在组件挂载和卸载时执行一次

  // **数据处理：按年份分组文章**
  // 使用 `reduce` 方法将文章列表按年份分组，例如：
  // {
  //   2023: [Post1, Post2],
  //   2022: [Post3],
  //   ...
  // }
  const groupedPosts = posts.reduce((acc, post) => {
    const year = new Date(post.createTime).getFullYear(); // 从创建时间中提取年份
    if (!acc[year]) acc[year] = []; // 如果该年份的数组不存在，则创建一个
    acc[year].push(post); // 将文章添加到对应年份的数组中
    return acc;
  }, {} as Record<number, Post[]>); // `Record<number, Post[]>` 类型断言，表示键是数字，值是 Post 数组

  // 对年份进行降序排序 (最近的年份在前)
  const sortedYears = Object.keys(groupedPosts).map(Number).sort((a, b) => b - a);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
      {/* 页面头部：标题和文章总数统计 */}
      <header className="mb-16 text-center space-y-4">
        <div className="inline-block p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-2">
          <PawPrint className="w-8 h-8 text-orange-500 dark:text-orange-400" /> {/* 猫爪图标 */}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">时光印记</h1>
        <p className="text-gray-500 dark:text-gray-400">
          共收录 <span className="text-orange-600 dark:text-orange-400 font-bold">{posts.length}</span> 篇技术与生活随笔
        </p>
      </header>

      {/* 加载骨架屏：在数据加载时显示动画 */}
      {loading ? (
        <div className="space-y-8 animate-pulse max-w-2xl mx-auto">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-4">
                <div className="w-24 h-6 bg-gray-100 dark:bg-zinc-800 rounded"></div>
                <div className="flex-1 h-24 bg-gray-100 dark:bg-zinc-800 rounded-xl"></div>
             </div>
           ))}
        </div>
      ) : (
        // 文章归档列表
        <div className="relative space-y-12 max-w-3xl mx-auto">
          {/* 中轴线 (桌面端显示) */}
          <div className="absolute left-4 md:left-1/2 top-4 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-orange-100 to-transparent dark:from-orange-800 dark:via-orange-900/20 -translate-x-1/2 md:block hidden"></div>
          
          {/* 移动端左侧线 */}
          <div className="absolute left-6 top-4 bottom-0 w-0.5 bg-gray-100 dark:bg-zinc-800 md:hidden"></div>

          {/* 遍历排好序的年份 */}
          {sortedYears.map(year => (
            <div key={year} className="relative z-10">
              {/* 年份标记 */}
              <div className="flex md:justify-center items-center mb-8">
                <div className="bg-white dark:bg-zinc-900 border-2 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 px-4 py-1 rounded-full font-bold text-lg shadow-sm z-20 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {year}
                </div>
              </div>

              {/* 该年份下的文章列表 */}
              <div className="space-y-8">
                {groupedPosts[year].map((post, index) => (
                  // 文章卡片：奇偶行交错显示在时间轴两侧
                  <div key={post.id} className={`flex flex-col md:flex-row items-center gap-4 md:gap-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* 1. 日期/元数据 (桌面端为空，移动端显示日期) */}
                    <div className="hidden md:flex w-1/2 px-8 justify-end text-right">
                       <div className={`${index % 2 === 0 ? 'text-left justify-start' : 'text-right justify-end'} w-full flex items-center text-sm text-gray-400 dark:text-gray-500 gap-2`}>
                          <span>{new Date(post.createTime).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                       </div>
                    </div>

                    {/* 2. 中轴节点 (时间轴上的圆点) */}
                    <div className="absolute left-6 md:left-1/2 w-8 h-8 -translate-x-1/2 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full border border-orange-100 dark:border-orange-900/50 shadow-sm z-10 group-hover:scale-110 transition-transform">
                      <div className="w-3 h-3 bg-orange-400 dark:bg-orange-600 rounded-full group-hover:bg-orange-500"></div>
                    </div>

                    {/* 3. 文章卡片 */}
                    <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                      <Link href={`/posts/${post.id}`} className="group block">
                        <Card className="p-5 hover:shadow-lg transition-all duration-300 border-gray-100 dark:border-zinc-800 group-hover:border-orange-200 dark:group-hover:border-orange-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40"></div>
                          
                          <div className="relative z-10">
                             <div className="flex items-center justify-between mb-2">
                               <Badge variant="outline" className="text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/50 border-orange-100 dark:border-orange-900 font-normal flex items-center gap-1">
                                 <Tag className="w-3 h-3" /> {post.categoryName || '未分类'}
                               </Badge>
                               {/* 移动端显示日期 */}
                               <span className="md:hidden text-xs text-gray-400 dark:text-gray-500">
                                 {new Date(post.createTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                               </span>
                             </div>
                             
                             {/* 文章标题 */}
                             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                               {post.title}
                             </h3>
                             
                             {/* 阅读全文链接 */}
                             <div className="flex items-center text-sm text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
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

          {/* 已到底提示 */}
          {posts.length > 0 && (
            <EndOfList />
          )}
        </div>
      )}
    </div>
  );
}