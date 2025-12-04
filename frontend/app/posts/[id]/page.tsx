import { notFound } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ChevronLeft } from "lucide-react";
import Link from 'next/link';
import CommentsSection from '@/components/CommentsSection';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface PostDetail {
  id: number;
  title: string;
  content: string;
  createTime: string;
  category?: string;
  categoryId: number;
  author?: string;
  commentCount: number;
}

// 获取文章详情数据
async function getPost(id: string) {
  try {
    // 注意：在服务器端请求 .NET 后端
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5095';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      // cache: 'no-store', // 开发时可以禁用缓存，上线时建议开启 revalidate
      next: { revalidate: 60 } // ISR: 每 60 秒重新生成一次页面
    });

    if (!res.ok) return undefined;

    const json = await res.json();
    if (!json.success) return undefined;

    return json.data as PostDetail;
  } catch (error) {
    console.error('Fetch post error:', error);
    return undefined;
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  // Next.js 15 中 params 是个 Promise，需要 await
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      {/* 顶部导航面包屑 */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="pl-0 text-gray-500 hover:text-orange-600">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回首页
          </Button>
        </Link>
      </div>

      {/* 文章头部信息 */}
      <header className="mb-10 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Link href={`/categories/${post.categoryId}`}>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer transition-colors">
              {post.category || '未分类'}
            </Badge>
          </Link>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{post.author || '匿名'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(post.createTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {/* 简单估算阅读时间：每 300 字 1 分钟 */}
            <span>{Math.ceil(post.content.length / 300)} 分钟阅读</span>
          </div>
        </div>
      </header>

      {/* 文章正文 (包含 TOC) */}
      <MarkdownRenderer content={post.content} />
      
      {/* 评论区 */}
      <div className="mt-16 max-w-4xl mx-auto">
         <div className="bg-orange-50/50 rounded-3xl p-8 border border-orange-100">
            <CommentsSection postId={post.id} />
         </div>
      </div>
    </div>
  );
}
