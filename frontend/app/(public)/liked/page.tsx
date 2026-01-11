'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchLikedPosts, PostSummary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ChevronLeft, LogIn, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EndOfList } from '@/components/EndOfList';

export default function LikedPostsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadPosts = async () => {
      try {
        const res = await fetchLikedPosts(page, 10);
        if (res.success) {
          if (page === 1) {
            setPosts(res.data);
          } else {
            setPosts(prev => [...prev, ...res.data]);
          }
          setHasMore(res.meta.hasMore ?? false);
          setTotalCount(res.meta.totalCount ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch liked posts', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user, authLoading, page]);

  // 未登录状态
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <div className="text-center py-16">
          <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            登录后查看点赞的文章
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            登录账户后，您可以查看所有点赞过的文章
          </p>
          <Link href="/login?redirect=/liked">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <LogIn className="w-4 h-4 mr-2" />
              立即登录
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">返回</span>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-current" />
            我的点赞
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            共 {totalCount} 篇文章
          </p>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* 空状态 */
        <div className="text-center py-16">
          <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            还没有点赞过文章
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            浏览文章时点击❤️按钮，收藏喜欢的内容
          </p>
          <Link href="/">
            <Button variant="outline">
              去逛逛
            </Button>
          </Link>
        </div>
      ) : (
        /* 文章列表 */
        <div className="space-y-4">
          {posts.map(post => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {post.summary}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(post.createTime), { 
                        addSuffix: true, 
                        locale: zhCN 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400 fill-current" />
                      {post.likeCount}
                    </span>
                    {post.categoryName && (
                      <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {post.categoryName}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* 加载更多 */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}

          {/* 已到底提示 */}
          {!hasMore && posts.length > 0 && (
            <EndOfList />
          )}
        </div>
      )}
    </div>
  );
}
