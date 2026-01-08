'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export interface Post {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  authorName: string;
  authorAvatar?: string;
  categoryName: string;
  categoryId: number;
  coverImage?: string;
  tags?: string[];
  isHidden?: boolean;
  seriesName?: string;   // 新增：系列名称
  seriesOrder?: number;  // 新增：系列中的顺序
}

interface PostListProps {
  initialPosts: Post[];
  initialHasMore: boolean;
  isAdmin?: boolean;
  defaultAuthor?: string; // 默认作者名
}

export default function PostList({ initialPosts, initialHasMore, isAdmin = false, defaultAuthor = "Admin" }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/posts?page=${nextPage}&pageSize=10`);
      const data = await res.json();
      if (data.success) {
        setPosts(prev => [...prev, ...data.data]);
        setPage(nextPage);
        if (data.meta) {
            setHasMore(data.meta.hasMore);
        } else {
            setHasMore(data.data.length === 10);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (e: React.MouseEvent, post: Post) => {
    e.preventDefault(); // 阻止链接跳转
    e.stopPropagation();

    const originalPosts = [...posts];
    
    // 乐观更新
    setPosts(posts.map(p => 
        p.id === post.id ? { ...p, isHidden: !p.isHidden } : p
    ));

    try {
        const res = await fetch(`/api/backend/posts/${post.id}/visibility`, {
            method: 'PATCH'
        });
        const json = await res.json();
        if (!json.success) {
            throw new Error(json.message);
        }
        toast.success(post.isHidden ? "文章已公开" : "文章已隐藏");
    } catch {
        toast.error('点赞失败');
        setPosts(originalPosts); // 回滚
    }
  };

  return (
    <div className="space-y-8">
       <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className={`group overflow-hidden border border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-3xl ${post.isHidden ? 'opacity-70 grayscale-[0.5] border-dashed border-gray-300' : ''}`}>
                  <div className="flex flex-col md:flex-row h-full relative">
                     {post.coverImage && (
                        <div className="md:w-64 h-48 md:h-auto relative p-3">
                          <div className="w-full h-full relative rounded-2xl overflow-hidden">
                            <Link href={`/posts/${post.id}`} className="block w-full h-full">
                              <Image 
                                src={post.coverImage} 
                                alt={post.title} 
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </Link>
                          </div>
                        </div>
                     )}
                     
                     <div className="flex-1 flex flex-col p-6 md:p-8">
                        {/* 第一行：定位信息（分类 + 系列）+ 时间 + 管理按钮 */}
                        {/* 移除 flex-wrap 防止换行，使用 min-w-0 + overflow-hidden 处理溢出 */}
                        <div className="flex items-center gap-2 mb-4 min-w-0 overflow-hidden">
                          {post.isHidden && (
                            <Badge variant="destructive" className="h-6 px-2 text-xs border-dashed border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                              Hidden
                            </Badge>
                          )}
                          
                          {/* 分类 */}
                          <Link href={`/categories/${post.categoryId}`}>
                             <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg px-3 py-1 transition-colors">
                                {post.categoryName || '未分类'}
                             </Badge>
                          </Link>
                          
                          {/* 系列（如果存在）*/}
                          {post.seriesName && (
                            <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-0.5">
                              📚 {post.seriesName} {post.seriesOrder ? `第${post.seriesOrder}篇` : ''}
                            </Badge>
                          )}
                          
                          {/* 时间 - 使用固定格式避免 SSR/CSR Hydration 不一致 */}
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </span>

                          {/* 管理员控制按钮 */}
                          {isAdmin && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                onClick={(e) => toggleVisibility(e, post)}
                                title={post.isHidden ? "点击公开" : "点击隐藏"}
                            >
                                {post.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          <Link href={`/posts/${post.id}`} className="block">
                            {post.title}
                          </Link>
                        </h3>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow leading-relaxed">
                          {post.excerpt || '暂无摘要...'}
                        </p>
                        
                        {/* 标签区（特征信息）*/}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {post.tags.slice(0, 4).map(tag => (
                              <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                                <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer rounded-md px-2 py-0.5 transition-colors">
                                  # {tag}
                                </Badge>
                              </Link>
                            ))}
                            {post.tags.length > 4 && (
                              <Badge variant="outline" className="text-xs text-gray-400 dark:text-gray-500 border-gray-200 dark:border-zinc-700 rounded-md px-2 py-0.5">
                                +{post.tags.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                             <Avatar className="w-6 h-6 border border-gray-100 dark:border-zinc-700">
                               <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'admin'}`} className="object-cover"/>
                               <AvatarFallback>User</AvatarFallback>
                             </Avatar>
                             <span>{post.authorName || defaultAuthor}</span>
                          </div>
                          <Link href={`/posts/${post.id}`}>
                            <span className="inline-flex items-center text-sm font-bold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors group/btn">
                              阅读全文 <ArrowRight className="w-4 h-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                          </Link>
                        </div>
                     </div>
                  </div>
                </Card>
              ))}
            </div>

      {hasMore && (
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full px-8 border-gray-200 dark:border-zinc-700 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:bg-zinc-900 dark:text-gray-300 transition-all shadow-sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? '加载中...' : '加载更多文章'}
          </Button>
        </div>
      )}
    </div>
  );
}
