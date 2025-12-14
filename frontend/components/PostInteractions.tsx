'use client';

import { Button } from "@/components/ui/button";
import { Heart, Share2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { toggleLike } from "@/lib/api";

interface PostInteractionsProps {
  postId: number;
  initialLikeCount: number;
}

export default function PostInteractions({ postId, initialLikeCount }: PostInteractionsProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  // 初始化：检查本地存储的点赞状态
  useEffect(() => {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      if (Array.isArray(likedPosts) && likedPosts.includes(postId)) {
        setLiked(true);
      }
    } catch (e) {
      console.error("Failed to parse liked_posts from localStorage", e);
    }
  }, [postId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制到剪贴板！");
    }
  };

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    // 乐观更新 UI
    const previousLiked = liked;
    const previousCount = likeCount;
    
    setLiked(!previousLiked);
    setLikeCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await toggleLike(postId);
      if (res.success) {
        // 使用后端返回的准确数据校准
        setLiked(res.isLiked);
        setLikeCount(res.likeCount);

        // 更新本地存储
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        let newLikedPosts = [];
        if (res.isLiked) {
            if (!likedPosts.includes(postId)) {
                newLikedPosts = [...likedPosts, postId];
            } else {
                newLikedPosts = likedPosts;
            }
            toast.success("感谢您的点赞！");
        } else {
            newLikedPosts = likedPosts.filter((id: number) => id !== postId);
        }
        localStorage.setItem('liked_posts', JSON.stringify(newLikedPosts));
      } else {
        throw new Error(res.message || "操作失败");
      }
    } catch (error) {
      // 发生错误，回滚 UI
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("点赞失败，请稍后重试");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 items-center pt-32 sticky top-20 self-start">
      <div className="flex flex-col items-center gap-1">
        <Button 
          variant="outline" 
          size="icon" 
          disabled={loading}
          className={`rounded-full h-12 w-12 border-gray-200 transition-colors ${liked ? 'text-orange-500 bg-orange-50 border-orange-200' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
        </Button>
        <span className="text-xs text-gray-500 font-medium">{likeCount > 0 ? likeCount : '点赞'}</span>
      </div>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-blue-500 hover:bg-blue-50"
        onClick={handleShare}
        aria-label="分享"
      >
        <Share2 className="w-5 h-5" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-orange-500 hover:bg-orange-50" 
        asChild
        aria-label="评论"
      >
        <a href="#comments">
          <MessageSquare className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
}