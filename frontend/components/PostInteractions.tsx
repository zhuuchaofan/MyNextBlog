'use client';

import { Button } from "@/components/ui/button";
import { Heart, Share2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function PostInteractions() {
  const [liked, setLiked] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制到剪贴板！");
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      toast.success("感谢您的点赞！(演示功能)");
    }
  };

  return (
    <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 items-center pt-32 sticky top-20 self-start">
      <Button 
        variant="outline" 
        size="icon" 
        className={`rounded-full h-12 w-12 border-gray-200 transition-colors ${liked ? 'text-pink-500 bg-pink-50 border-pink-200' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'}`}
        onClick={handleLike}
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-blue-500 hover:bg-blue-50"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full h-12 w-12 border-gray-200 text-gray-500 hover:text-orange-500 hover:bg-orange-50" 
        asChild
      >
        <a href="#comments">
          <MessageSquare className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
}