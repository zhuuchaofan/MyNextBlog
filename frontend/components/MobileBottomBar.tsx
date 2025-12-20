'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Share2 } from "lucide-react";
import { toggleLike } from "@/lib/api";
import { toast } from "sonner";

interface MobileBottomBarProps {
  postId: number;
  initialLikeCount: number;
  commentCount: number; // passed from server or parent
}

export default function MobileBottomBar({ postId, initialLikeCount, commentCount }: MobileBottomBarProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  
  // Reuse like logic from PostInteractions (DRY violation but quick for now, ideal refactor later)
  useEffect(() => {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      if (Array.isArray(likedPosts) && likedPosts.includes(postId)) {
        setLiked(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [postId]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    const previousLiked = liked;
    setLiked(!previousLiked);
    setLikeCount(prev => previousLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await toggleLike(postId);
      if (res.success) {
        setLiked(res.isLiked);
        setLikeCount(res.likeCount);
        // update simple localStorage
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        let newLikedPosts = [];
        if (res.isLiked) {
             if (!likedPosts.includes(postId)) newLikedPosts = [...likedPosts, postId];
             else newLikedPosts = likedPosts;
        } else {
             newLikedPosts = likedPosts.filter((id: number) => id !== postId);
        }
        localStorage.setItem('liked_posts', JSON.stringify(newLikedPosts));
      }
    } catch (error) {
      setLiked(previousLiked); // rollback
      setLikeCount(prev => previousLiked ? prev + 1 : prev - 1);
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const scrollToComments = () => {
     const commentsSection = document.getElementById('comments');
     if (commentsSection) {
         commentsSection.scrollIntoView({ behavior: 'smooth' });
     }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
       navigator.clipboard.writeText(window.location.href);
       toast.success("链接已复制");
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 px-4 py-3 pb-safe-area-inset-bottom transition-transform duration-300">
      <div className="flex items-center gap-4 max-w-md mx-auto">
        {/* 伪输入框 -> 点击滚动到评论区 */}
        <div 
            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-10 px-4 flex items-center text-gray-500 text-sm cursor-text active:scale-95 transition-transform"
            onClick={scrollToComments}
        >
            <span className="truncate">写下你的评论...</span>
        </div>

        {/* 交互按钮组 */}
        <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="text-gray-500" onClick={scrollToComments}>
                <div className="relative">
                    <MessageSquare className="w-6 h-6" />
                    {commentCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center">
                            {commentCount > 99 ? '99+' : commentCount}
                        </span>
                    )}
                </div>
             </Button>

             <Button variant="ghost" size="icon" className={liked ? "text-red-500" : "text-gray-500"} onClick={handleLike}>
                <div className="flex flex-col items-center">
                    <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                    {/* <span className="text-[10px] font-medium">{likeCount}</span> No space for text maybe? */}
                </div>
             </Button>
             
             <Button variant="ghost" size="icon" className="text-gray-500" onClick={handleShare}>
                <Share2 className="w-6 h-6" />
             </Button>
        </div>
      </div>
    </div>
  );
}
