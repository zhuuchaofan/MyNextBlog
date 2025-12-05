import { notFound } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ChevronLeft, Share2, Heart, MessageSquare } from "lucide-react";
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
  coverImage?: string; // Added from backend update
}

async function getPost(id: string) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5095';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      next: { revalidate: 60 }
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
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  const readingTime = Math.ceil(post.content.length / 300);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Hero Image / Header Background */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-900 overflow-hidden">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover opacity-60 blur-sm scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-600 opacity-80"></div>
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
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10 mt-8">
           <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Link href={`/categories/${post.categoryId}`}>
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none px-3 py-1 mb-4">
                  {post.category || '未分类'}
                </Badge>
             </Link>
             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
               {post.title}
             </h1>
             <div className="flex items-center justify-center gap-6 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-2">
                   <Avatar className="w-8 h-8 border-2 border-white/50">
                     <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || 'admin'}`} />
                     <AvatarFallback>User</AvatarFallback>
                   </Avatar>
                   <span className="font-medium">{post.author || '匿名'}</span>
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
           <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 items-center pt-32 sticky top-20 self-start">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-pink-500 hover:bg-pink-50">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-blue-500 hover:bg-blue-50">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-orange-500 hover:bg-orange-50" asChild>
                <a href="#comments">
                  <MessageSquare className="w-5 h-5" />
                </a>
              </Button>
           </div>

           {/* Main Content */}
           <div className="lg:col-span-11 bg-white rounded-t-3xl md:rounded-3xl shadow-xl p-6 md:p-12 min-h-[500px]">
              <MarkdownRenderer content={post.content} />
              
              <div className="border-t border-gray-100 my-12"></div>

              {/* Comments Section */}
              <div id="comments" className="max-w-3xl mx-auto">
                 <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                   <MessageSquare className="w-5 h-5 text-orange-500" /> 
                   评论区
                 </h3>
                 <div className="bg-gray-50 rounded-3xl p-6 md:p-8">
                    <CommentsSection postId={post.id} />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}