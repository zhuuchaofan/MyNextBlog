import { notFound } from 'next/navigation'; // Next.js 用于处理 404 错误的函数
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ChevronLeft } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import CommentsSection from '@/components/CommentsSection';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // Markdown 渲染组件
import PostInteractions from '@/components/PostInteractions'; // 交互组件（如点赞/分享）
import MobileBottomBar from '@/components/MobileBottomBar'; // 移动端底部栏
import { SeriesNavigation } from '@/components/SeriesNavigation'; // 引入系列导航
import { getPost, getCommentsServer } from '@/lib/data'; // 服务端数据获取函数

// 定义页面属性接口
// `params` 是一个 Promise，这是 Next.js 15 的新特性，路由参数需要异步获取。
interface Props {
  params: Promise<{ id: string }>;
}

// 1. 生成 SEO 元数据 (Metadata Generation)
// Next.js 会在渲染页面前调用此函数，用于生成 <head> 中的 <title>, <meta> 等标签。
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params; // 解析路由参数 ID
  const post = await getPost(resolvedParams.id); // 获取文章详情

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  // 提取纯文本摘要（这里简单地去除了 Markdown 符号）
  const description = post.content.substring(0, 160).replace(/[#*`]/g, '') + '...';

  return {
    title: `${post.title} - MyNextBlog`, // 网页标题
    description: description,            // 网页描述 (SEO 关键)
    // Open Graph 协议 (用于社交媒体分享预览)
    openGraph: {
      title: post.title,
      description: description,
      type: 'article',
      publishedTime: post.createTime,
      authors: [post.authorName || 'Admin'],
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

// 2. 文章详情页组件 (Server Component)
export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  
  // 获取数据 (Server-Side)
  // getPost 内部实现了 BFF 模式，会自动注入 Authentication Header
  // 并根据用户身份决定缓存策略 (管理员不缓存，普通用户缓存 60s)。
  const post = await getPost(resolvedParams.id);

  // 如果文章不存在，抛出 404 错误
  // 这会渲染 app/not-found.tsx 页面
  if (!post) {
    notFound();
  }

  // 在服务端获取首屏评论 (RSC 模式)
  // 这样首屏 HTML 就包含评论，提升 SEO 和性能
  const commentsData = await getCommentsServer(post.id);

  // 简单估算阅读时间：假设每分钟阅读 300 字
  const readingTime = Math.ceil(post.content.length / 300);

  return (
    <div className="min-h-screen pb-20 transition-colors duration-300">
      {/* --- 顶部 Hero 区域 (背景图/标题) --- */}
      <div className="relative w-full min-h-[40vh] md:min-h-[50vh] bg-gray-900 dark:bg-zinc-950 overflow-hidden flex flex-col justify-center">
        {/* 背景图处理 */}
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill // 填满父容器
            priority // 设为高优先级加载 (LCP 优化)
            className="object-cover opacity-60 blur-sm scale-105" // 模糊和微缩放效果
          />
        ) : (
          // 如果没有封面图，使用渐变背景作为占位
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-orange-400 to-pink-600 dark:from-orange-800 dark:to-pink-900 opacity-80"></div>
        )}
        
        {/* 返回按钮 (悬浮) */}
        <div className="absolute top-8 left-4 md:left-8 z-20">
          <Link href="/">
            <Button variant="secondary" size="sm" className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none">
              <ChevronLeft className="w-4 h-4 mr-1" /> 返回首页
            </Button>
          </Link>
        </div>

        {/* 标题信息 (覆盖在背景之上) */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 mt-8 pb-32 pt-20">
           <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* 定位信息：分类 + 系列 */}
             <div className="flex items-center justify-center gap-2 mb-4">
               <Link href={`/categories/${post.categoryId}`}>
                  <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none px-3 py-1">
                    {post.categoryName || '未分类'}
                  </Badge>
               </Link>
               {post.seriesInfo && (
                  <Link href={`/series/${post.seriesInfo.id}`}>
                    <Badge variant="secondary" className="bg-blue-500/30 backdrop-blur-md text-white hover:bg-blue-500/40 border-none px-3 py-1">
                      📚 {post.seriesInfo.name} · 第{post.seriesInfo.currentOrder}篇
                    </Badge>
                  </Link>
               )}
             </div>
             
             {/* 文章标题 */}
             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
               {post.title}
             </h1>

             {/* 元信息：作者、时间、阅读时长 */}
             <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-2">
                   <Avatar className="w-8 h-8 border-2 border-white/50">
                     <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'admin'}`} className="object-cover" />
                     <AvatarFallback>User</AvatarFallback>
                   </Avatar>
                   <span className="font-medium">{post.authorName || '匿名'}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {new Date(post.createTime).toLocaleDateString()}
                  {post.updatedAt && (
                    <span className="text-white/70 ml-1">
                      (更新于 {new Date(post.updatedAt).toLocaleDateString()})
                    </span>
                  )}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {readingTime} min read
                </span>
             </div>
             
             {/* 标签（特征信息）*/}
             {post.tags && post.tags.length > 0 && (
               <div className="flex items-center justify-center gap-2 pt-2">
                 {post.tags.map(tag => (
                   <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                     <Badge variant="outline" className="text-xs text-white/80 border-white/30 hover:bg-white/10 cursor-pointer px-2 py-0.5 transition-colors">
                       # {tag}
                     </Badge>
                   </Link>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

      {/* --- 正文内容区域 --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* 左侧边栏：交互按钮 (仅在大屏显示) */}
           <PostInteractions postId={post.id} initialLikeCount={post.likeCount} />

           {/* 主内容容器 */}
           <div className="lg:col-span-11 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-3xl shadow-xl dark:shadow-black/50 border border-gray-100 dark:border-zinc-800 p-6 md:p-12 min-h-[500px] transition-colors duration-300">
              {/* Markdown 渲染器：将 Markdown 文本转换为 HTML */}
              <MarkdownRenderer content={post.content} />
              
              {/* 系列导航（文章末尾） */}
              <SeriesNavigation seriesInfo={post.seriesInfo} />
              
              <div className="border-t border-gray-100 dark:border-zinc-800 my-12"></div>

              {/* 评论区组件 */}
              <div id="comments" className="max-w-3xl mx-auto">
                 <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-6 md:p-8 border border-transparent dark:border-zinc-800">
                    <CommentsSection 
                      postId={post.id} 
                      initialComments={commentsData.comments}
                      initialTotalCount={commentsData.totalCount}
                      initialHasMore={commentsData.hasMore}
                    />
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* 移动端底部吸附栏 */}
      <MobileBottomBar 
        postId={post.id} 
        initialLikeCount={post.likeCount} 
        commentCount={post.commentCount} 
      />
    </div>
  );
}