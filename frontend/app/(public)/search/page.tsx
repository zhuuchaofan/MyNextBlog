'use client'; // 标记为客户端组件，因为需要使用 Hooks (useState, useEffect, useSearchParams)

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // 导入 Next.js 提供的钩子，用于获取 URL 中的查询参数
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Search as SearchIcon, Frown } from "lucide-react";

// 定义文章数据的接口 (精简版，用于搜索结果展示)
interface Post {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  author: string;
  category: string;
  categoryId: number;
  coverImage?: string;
}

// 后端 API 返回的原始数据类型
interface PostFromApi {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  authorName: string;    // 后端字段名
  categoryName: string;  // 后端字段名
  categoryId: number;
  coverImage?: string;
}

/**
 * SearchResults 组件：实际处理搜索逻辑和展示结果的组件
 * --------------------------------------------------------------------------------
 * 这个组件是一个客户端组件，它会根据 URL 中的查询参数 (q 或 tag) 向后端请求搜索结果。
 * 之所以将其封装在 `Suspense` 中，是为了利用 React Concurrent 特性，在等待 `useSearchParams` 
 * 准备好参数时显示 Fallback。
 */
function SearchResults() {
  const searchParams = useSearchParams(); // 获取 URL 中的所有查询参数
  const query = searchParams.get('q');    // 获取名为 'q' 的查询参数（搜索关键词）
  const tag = searchParams.get('tag');    // 获取名为 'tag' 的查询参数（标签名称）
  
  const [posts, setPosts] = useState<Post[]>([]); // 存储搜索结果文章列表
  const [loading, setLoading] = useState(false); // 控制加载状态

  // `useEffect` 钩子，在 `query` 或 `tag` 变化时重新执行搜索
  useEffect(() => {
    // 构建 API URL
    let url = '';
    if (query) {
      url = `/api/backend/posts?search=${encodeURIComponent(query)}`;
    } else if (tag) {
      url = `/api/backend/posts?tag=${encodeURIComponent(tag)}`;
    }

    // 如果没有搜索条件，清空结果
    if (!url) {
      setPosts([]);
      return;
    }

    // 使用 IIFE (立即执行函数) 包装 async 逻辑，避免 lint 警告
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (cancelled) return; // 避免竞态条件
        
        if (data.success) {
          const formattedPosts = data.data.map((p: PostFromApi) => ({
            ...p,
            author: p.authorName,
            category: p.categoryName
          }));
          setPosts(formattedPosts);
        }
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchData();
    
    // 清理函数：组件卸载或依赖变化时取消请求处理
    return () => { cancelled = true; };
  }, [query, tag]);

  // 1. 如果没有搜索关键词和标签，显示提示用户输入的界面
  if (!query && !tag) {
    return (
      <div className="text-center py-20">
        <SearchIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">请输入关键词或选择标签开始搜索</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 搜索结果头部：显示搜索关键词/标签，以及结果数量 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tag ? (
            <>标签: <span className="text-orange-600 dark:text-orange-400">#{tag}</span></>
          ) : (
            <>搜索: <span className="text-orange-600 dark:text-orange-400">"{query}"</span></>
          )}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">找到 {posts.length} 个相关结果</p>
      </header>

      {/* 根据加载状态和结果数量显示不同内容 */}
      {loading ? (
        // 加载动画 (骨架屏)
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        // 没有搜索结果时的提示
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
          <Frown className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">抱歉，没有找到相关文章</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">换个关键词试试？</p>
        </div>
      ) : (
        // 搜索结果列表
        <div className="grid gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100 dark:border-zinc-800 group dark:bg-zinc-900">
              <div className="flex flex-col md:flex-row h-full">
                  {/* 封面图片 (如果存在) */}
                  {post.coverImage && (
                    <div className="md:w-48 h-48 md:h-auto bg-gray-100 dark:bg-zinc-800 relative overflow-hidden group-hover:cursor-pointer">
                      <Link href={`/posts/${post.id}`} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </Link>
                    </div>
                  )}
                  
                  {/* 文章信息卡片内容 */}
                  <div className="flex-1 flex flex-col p-6"> {/* 添加 p-6 保持内边距 */}
                    <CardHeader className="p-0 mb-4"> {/* 重置 CardHeader 的内边距 */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/50">{post.category}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-xl md:text-2xl transition-colors">
                        <Link href={`/posts/${post.id}`} className="hover:text-orange-600 dark:hover:text-orange-400 hover:underline decoration-orange-300 underline-offset-4 cursor-pointer">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 mb-4"> {/* 重置 CardContent 的内边距 */}
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2 md:line-clamp-3">
                        {post.excerpt}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 p-0"> {/* 重置 CardFooter 的内边距 */}
                      <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-zinc-800 px-0 cursor-pointer">
                          阅读全文 <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SearchPage 组件：搜索结果页入口
 * --------------------------------------------------------------------------------
 * 这是一个 Server Component (默认)，它使用 `Suspense` 来包裹 `SearchResults` 客户端组件。
 * 这样做是为了避免在 `useSearchParams` 首次在客户端准备好时，由于服务端渲染 (SSR) 和客户端
 * 水合 (Hydration) 之间可能存在的差异导致警告或错误。
 * `Suspense` 确保 `SearchResults` 只有在浏览器端才能完全渲染，
 * 并在参数未就绪时显示一个简单的加载状态。
 */
export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-12 min-h-[60vh]">
      <Suspense fallback={<div className="text-center py-20 text-gray-400 dark:text-gray-500">正在搜索...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}