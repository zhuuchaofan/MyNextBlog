import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { cookies } from 'next/headers';

// Backend API call for series detail with posts
async function getSeriesWithPosts(id: string) {
  const baseUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  // 获取 Token 以识别管理员
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}/api/series/${id}`, {
      headers,
      next: { revalidate: token ? 0 : 60 } // 管理员不缓存
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

// Fetch posts in this series (using dedicated endpoint)
async function getSeriesPosts(seriesId: string) {
  const baseUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  // 获取 Token 以识别管理员
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}/api/series/${seriesId}/posts`, {
      headers,
      next: { revalidate: token ? 0 : 60 } // 管理员不缓存
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    return json.data;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const series = await getSeriesWithPosts(resolvedParams.id);
  
  if (!series) {
    return { title: '系列未找到' };
  }
  
  return {
    title: `${series.name} - 系列文章`,
    description: series.description || `阅读 ${series.name} 系列的全部文章`,
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const series = await getSeriesWithPosts(resolvedParams.id);
  
  if (!series) {
    notFound();
  }
  
  const posts = await getSeriesPosts(resolvedParams.id);
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Back Link */}
      <Link 
        href="/" 
        className="inline-flex items-center text-gray-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回首页
      </Link>
      
      {/* Series Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <BookOpen className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-sm font-medium text-orange-500 dark:text-orange-400">
            系列文章 · {series.postCount || posts.length} 篇
          </span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {series.name}
        </h1>
        
        {series.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {series.description}
          </p>
        )}
      </div>
      
      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            该系列暂无文章
          </div>
        ) : (
          posts.map((post: { id: number; title: string; excerpt?: string; createTime: string; seriesOrder: number }, index: number) => (
            <Link 
              key={post.id} 
              href={`/posts/${post.id}`}
              className="block group"
            >
              <div className="flex items-start gap-4 p-6 bg-white dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-md transition-all">
                {/* Order Number */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold rounded-full">
                  {index + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors mb-1">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(post.createTime).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
