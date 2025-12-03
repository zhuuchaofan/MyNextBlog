'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from 'next/link';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  author: string;
  category: string;
  coverImage?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/posts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPosts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Hero Section */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-orange-100 mb-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
            👋 欢迎光临
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            这里是 <span className="text-orange-500">球球 & 布丁</span> 的<br/>
            技术后花园 🏡
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            记录 .NET Core 开发心得，分享全栈技术实战，偶尔晒晒猫。
            这是一个用 <code className="bg-gray-100 px-2 py-1 rounded text-sm">Next.js</code> + <code className="bg-gray-100 px-2 py-1 rounded text-sm">.NET 10</code> 构建的混合架构博客。
          </p>
        </div>
        <div className="w-full md:w-1/3 aspect-square bg-orange-50 rounded-2xl flex items-center justify-center text-6xl">
           🐱
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
          最新文章
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100 group">
                <div className="flex flex-col md:flex-row">
                   {/* Cover Image Placeholder */}
                   {post.coverImage && (
                      <div className="md:w-48 h-48 md:h-auto bg-gray-100 relative overflow-hidden group-hover:cursor-pointer">
                        <Link href={`/posts/${post.id}`} className="block w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </Link>
                      </div>
                   )}
                   
                   <div className="flex-1 flex flex-col">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-200">{post.category || '未分类'}</Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-xl md:text-2xl transition-colors">
                          <Link href={`/posts/${post.id}`} className="hover:text-orange-600 hover:underline decoration-orange-300 underline-offset-4 cursor-pointer">
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-gray-600 line-clamp-2 md:line-clamp-3">
                          {post.excerpt}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link href={`/posts/${post.id}`}>
                          <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-0 cursor-pointer">
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
    </div>
  );
}
