'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Search as SearchIcon, Frown } from "lucide-react";

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

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`/api/backend/posts?search=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setPosts(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setPosts([]);
    }
  }, [query]);

  if (!query) {
    return (
      <div className="text-center py-20">
        <SearchIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">请输入关键词开始搜索</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          搜索: <span className="text-orange-600">"{query}"</span>
        </h1>
        <p className="text-gray-500 mt-2">找到 {posts.length} 个相关结果</p>
      </header>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Frown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">没有找到相关文章</p>
          <p className="text-gray-400 text-sm mt-2">换个关键词试试？</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100 group">
              <div className="flex flex-col md:flex-row h-full">
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
                        <Badge variant="outline" className="text-orange-600 border-orange-200">{post.category}</Badge>
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
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-12 min-h-[60vh]">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}