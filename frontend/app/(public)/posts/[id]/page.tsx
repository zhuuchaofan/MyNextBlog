import { notFound } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ChevronLeft } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import CommentsSection from '@/components/CommentsSection';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PostInteractions from '@/components/PostInteractions';
import { getPost } from '@/lib/data';

interface Props {
  params: Promise<{ id: string }>;
}

// 1. SEO Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - MyNextBlog`,
    description: post.content.substring(0, 160).replace(/[#*`]/g, '') + '...',
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160),
      type: 'article',
      publishedTime: post.createTime,
      authors: [post.authorName || 'Admin'],
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  const readingTime = Math.ceil(post.content.length / 300);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 transition-colors duration-300">
      {/* 1. Hero Image / Header Background */}
      <div className="relative w-full min-h-[40vh] md:min-h-[50vh] bg-gray-900 dark:bg-zinc-950 overflow-hidden flex flex-col justify-center">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-60 blur-sm scale-105"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-orange-400 to-pink-600 dark:from-orange-800 dark:to-pink-900 opacity-80"></div>
        )}
        
        {/* Back Button Overlay */}
        <div className="absolute top-8 left-4 md:left-8 z-20">
          <Link href="/">
            <Button variant="secondary" size="sm" className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none">
              <ChevronLeft className="w-4 h-4 mr-1" /> 返回首页
            </Button>
          </Link>
        </div>

        {/* Title Overlay */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 mt-8 pb-32 pt-20">
           <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Link href={`/categories/${post.categoryId}`}>
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none px-3 py-1 mb-4">
                  {post.categoryName || '未分类'}
                </Badge>
             </Link>
             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
               {post.title}
             </h1>
             <div className="flex items-center justify-center gap-6 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-2">
                   <Avatar className="w-8 h-8 border-2 border-white/50">
                     <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || 'admin'}`} className="object-cover" />
                     <AvatarFallback>User</AvatarFallback>
                   </Avatar>
                   <span className="font-medium">{post.authorName || '匿名'}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {new Date(post.createTime).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {readingTime} min read
                </span>
             </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Sidebar: Interaction (Desktop) */}
           <PostInteractions />

           {/* Main Content */}
           <div className="lg:col-span-11 bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl shadow-xl dark:shadow-black/50 p-6 md:p-12 min-h-[500px] transition-colors duration-300">
              <MarkdownRenderer content={post.content} />
              
              <div className="border-t border-gray-100 dark:border-zinc-800 my-12"></div>

              {/* Comments Section */}
              <div id="comments" className="max-w-3xl mx-auto">
                 <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-6 md:p-8 border border-transparent dark:border-zinc-800">
                    <CommentsSection postId={post.id} />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}