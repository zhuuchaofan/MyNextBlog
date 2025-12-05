'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Sparkles, Tag, Github } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG, PETS } from "@/lib/constants";
import { fetchPopularTags } from "@/lib/api";

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

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = (pageNo: number, append: boolean = false) => {
    setLoading(true);
    fetch(`/api/backend/posts?page=${pageNo}&pageSize=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (append) {
            setPosts(prev => [...prev, ...data.data]);
          } else {
            setPosts(data.data);
          }
          
          if (data.meta) {
            setHasMore(data.meta.hasMore);
          } else {
            setHasMore(data.data.length === 10);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // Initial load
    loadPosts(1);

    // Fetch tags
    fetchPopularTags()
      .then(data => {
        if (data.success) setPopularTags(data.data);
      })
      .catch(console.error);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
      
      {/* Hero Section - 统一风格 */}
      <div className="relative bg-gradient-to-br from-orange-50 to-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-orange-100/50 border border-white mb-16 isolate overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100 text-orange-600 text-sm font-medium shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>探索 • 记录 • 分享</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              {PETS.qiuqiu.name} & {PETS.pudding.name}的 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                技术后花园
              </span>
              <span className="ml-2 text-4xl md:text-6xl align-middle">🏡</span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              这里不仅有 .NET 与 Next.js 的硬核技术干货，还有两只猫主子的软萌日常。
              在这个数字化的角落，我们用代码构建世界，用猫毛点缀生活。
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Link href="/archive">
                <Button className="rounded-full h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all">
                  开始阅读
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="rounded-full h-12 px-8 border-gray-200 hover:bg-white hover:border-orange-200 text-gray-700">
                  认识博主
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-white rounded-full animate-pulse"></div>
            <div className="relative w-full h-full bg-white/50 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={PETS.qiuqiu.avatar} alt={PETS.qiuqiu.name} className="w-full h-full object-cover rounded-3xl" />
               <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl overflow-hidden shadow-2xl animate-bounce duration-1000">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={PETS.pudding.avatar} alt={PETS.pudding.name} className="w-full h-full object-cover" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content: Post List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="flex w-3 h-3 bg-orange-500 rounded-full ring-4 ring-orange-100"></span>
              最新发布
            </h2>
            <Link href="/archive" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading && posts.length === 0 ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-3xl ring-1 ring-gray-100">
                  <div className="flex flex-col md:flex-row h-full">
                     {post.coverImage && (
                        <div className="md:w-64 h-48 md:h-auto relative p-3">
                          <div className="w-full h-full relative rounded-2xl overflow-hidden">
                            <Link href={`/posts/${post.id}`} className="block w-full h-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </Link>
                          </div>
                        </div>
                     )}
                     
                     <div className="flex-1 flex flex-col p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <Link href={`/categories/${post.categoryId}`}>
                             <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg px-3 py-1 transition-colors">
                                {post.category || '未分类'}
                             </Badge>
                          </Link>
                          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-orange-600 transition-colors">
                          <Link href={`/posts/${post.id}`}>
                            {post.title}
                          </Link>
                        </h3>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-grow leading-relaxed">
                          {post.excerpt || '暂无摘要...'}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">👤</div>
                             <span>{post.author || SITE_CONFIG.author}</span>
                          </div>
                          <Link href={`/posts/${post.id}`}>
                            <span className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors group/btn">
                              阅读全文 <ArrowRight className="w-4 h-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                          </Link>
                        </div>
                     </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多文章'}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 space-y-8">
           {/* About Widget */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-100 to-pink-100 opacity-50"></div>
              <div className="relative z-10 -mt-4 mb-4">
                 <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden bg-cover bg-center" style={{backgroundImage: `url('${SITE_CONFIG.avatar}')`}}></div>
                 </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{SITE_CONFIG.author}</h3>
              <p className="text-xs text-gray-500 mb-4">Fullstack Developer</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                写代码，撸猫，记录生活。
                <br/>
                这里是我存放思想碎片的地方。
              </p>
              <div className="flex justify-center gap-3">
                 <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-gray-200" asChild>
                   <Link href={SITE_CONFIG.social.github} target="_blank">
                     <Github className="w-4 h-4 text-gray-600" />
                   </Link>
                 </Button>
                 {/* Add more social icons */}
              </div>
           </div>

           {/* Tags Widget */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> 热门话题
              </h3>
              <div className="flex flex-wrap gap-2">
                 {popularTags.length === 0 ? (
                    <span className="text-sm text-gray-400">暂无标签</span>
                 ) : (
                    popularTags.map(tag => (
                     <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                       <Badge variant="secondary" className="bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition-colors rounded-lg px-3 py-1.5 font-normal">
                         # {tag}
                       </Badge>
                     </Link>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
