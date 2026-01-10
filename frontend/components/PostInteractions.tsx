'use client';

import { Button } from "@/components/ui/button";
import { Heart, Share2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useLike } from "@/lib/hooks/useLike";

interface PostInteractionsProps {
  postId: number;
  initialLikeCount: number;
}

export default function PostInteractions({ postId, initialLikeCount }: PostInteractionsProps) {
  const { liked, likeCount, loading, handleLike } = useLike(postId, initialLikeCount);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制到剪贴板！");
    }
  };

  return (
    <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 items-center pt-32 sticky top-20 self-start">
      <div className="flex flex-col items-center gap-1">
        <Button 
          variant="outline" 
          size="icon" 
          disabled={loading}
          className={`rounded-full h-12 w-12 border-gray-200 transition-all duration-300 ${liked ? 'text-orange-500 bg-orange-50 border-orange-200 scale-110' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 transition-transform duration-300 ${liked ? 'fill-current scale-110' : ''}`} />
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