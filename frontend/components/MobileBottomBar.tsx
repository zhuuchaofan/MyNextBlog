"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Heart, Share2, Send, Loader2 } from "lucide-react";
import { Comment } from "@/lib/api";
import { submitCommentAction } from "@/lib/actions/comment";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLike } from "@/lib/hooks/useLike";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface MobileBottomBarProps {
  postId: number;
  commentCount: number;
  initialLikeCount: number;
  onCommentSuccess?: (comment: Comment) => void;
}

export default function MobileBottomBar({
  postId,
  commentCount,
  initialLikeCount,
  onCommentSuccess,
}: MobileBottomBarProps) {
  const { user } = useAuth();
  
  // 使用 useLike Hook 管理点赞状态
  const { liked, likeCount, loading, handleLike } = useLike(postId, initialLikeCount);

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // 评论计数（可变状态）
  const [displayCommentCount, setDisplayCommentCount] = useState(commentCount);
  
  // 监听评论成功事件，同步更新计数
  useEffect(() => {
    const handleCommentAdded = () => {
      setDisplayCommentCount(prev => prev + 1);
    };
    window.addEventListener('comment-added', handleCommentAdded);
    return () => window.removeEventListener('comment-added', handleCommentAdded);
  }, []);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制");
    }
  };

  const handleSubmitComment = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      const nameToSubmit = user ? user.username : guestName;
      if (!user && !nameToSubmit.trim()) {
        toast.error("请输入昵称");
        setSubmitting(false);
        return;
      }

      // 使用 Server Action 提交评论（会触发 revalidatePath）
      const data = await submitCommentAction(postId, content, nameToSubmit);

      if (data.success) {
        setContent("");
        setDrawerOpen(false);
        toast.success("评论发表成功！");
        onCommentSuccess?.(data.comment);

        // 触发自定义事件，通知 CommentsSection 刷新
        window.dispatchEvent(
          new CustomEvent("comment-added", {
            detail: data.comment,
          })
        );
      } else {
        toast.error("提交失败：" + data.message);
      }
    } catch {
      toast.error("操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 px-4 py-3 pb-safe-area-inset-bottom transition-transform duration-300">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          {/* 伪输入框 -> 点击打开 Drawer */}
          <div
            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-10 px-4 flex items-center text-gray-500 text-sm cursor-text active:scale-95 transition-transform"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="truncate">写下你的评论...</span>
          </div>

          {/* 交互按钮组 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
              onClick={() => setDrawerOpen(true)}
            >
              <div className="relative">
                <MessageSquare className="w-6 h-6" />
                {displayCommentCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center">
                    {displayCommentCount > 99 ? "99+" : displayCommentCount}
                  </span>
                )}
              </div>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              disabled={loading}
              className={liked ? "text-red-500" : "text-gray-500"}
              onClick={handleLike}
            >
              <div className="relative">
                <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
                {likeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center animate-in zoom-in">
                    {likeCount > 99 ? "99+" : likeCount}
                  </span>
                )}
              </div>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
              onClick={handleShare}
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* 评论输入 Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>发表评论</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              分享你的想法，与作者和其他读者交流
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 px-4">
            {!user && (
              <Input
                placeholder="昵称 (必填)"
                className="h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            )}

            <Textarea
              placeholder="写下你的想法..."
              className="min-h-[100px] bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={submitting || !content.trim()}
              onClick={handleSubmitComment}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              发送
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
