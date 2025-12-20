'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchComments, submitComment, Comment } from '@/lib/api';
import { MessageSquare, User, Send, Reply, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';

export default function CommentsSection({ postId }: { postId: number }) {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // 回复状态：当前正在回复哪个评论 ID
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // 初始化加载
  useEffect(() => {
    loadData(1);
  }, [postId]);

  const loadData = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await fetchComments(postId, pageNum);
      if (data.success) {
        if (pageNum === 1) {
          setAllComments(data.comments);
        } else {
          // 简单的去重合并 (防止重复 key)
          setAllComments(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newComments = data.comments.filter((c: Comment) => !existingIds.has(c.id));
            return [...prev, ...newComments];
          });
        }
        setTotalCount(data.totalCount);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadData(page + 1);
  };

  // 递归插入新评论
  const addCommentToTree = (nodes: Comment[], newComment: Comment): Comment[] => {
    // 如果是根评论，直接插到最前面
    if (!newComment.parentId) {
        return [newComment, ...nodes];
    }

    // 否则递归查找父节点
    return nodes.map(node => {
        if (node.id === newComment.parentId) {
            return {
                ...node,
                children: [...(node.children || []), newComment]
            };
        }
        if (node.children && node.children.length > 0) {
             return {
                 ...node,
                 children: addCommentToTree(node.children, newComment)
             };
        }
        return node;
    });
  };

  const handleCommentSuccess = (newComment: Comment) => {
    setAllComments(prev => addCommentToTree(prev, newComment));
    setTotalCount(prev => prev + 1);
    setReplyingTo(null); // 关闭回复框
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">评论区 ({totalCount})</h2>
      </div>

      {/* 顶部发表框 (发表一级评论) */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-10 transition-colors duration-300">
        <CommentForm postId={postId} onSuccess={handleCommentSuccess} textareaId="main-comment-textarea" />
      </div>

      {loading && page === 1 ? (
        <div className="text-center text-gray-400 py-10 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> 加载评论中...
        </div>
      ) : allComments.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
          还没有人评论，快来抢沙发吧！🛋️
        </div>
      ) : (
        <div className="space-y-6">
          {allComments.map((node) => (
            <CommentItem 
                key={node.id} 
                node={node} 
                postId={postId} 
                replyingTo={replyingTo} 
                setReplyingTo={setReplyingTo}
                onSuccess={handleCommentSuccess}
            />
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
                <Button variant="ghost" onClick={handleLoadMore} disabled={loading} className="text-gray-500 dark:text-gray-400 hover:text-orange-500">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    加载更多评论
                </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 单个评论项组件 (递归渲染)
function CommentItem({ 
    node, 
    postId, 
    replyingTo, 
    setReplyingTo, 
    onSuccess 
}: { 
    node: Comment, 
    postId: number, 
    replyingTo: number | null, 
    setReplyingTo: (id: number | null) => void,
    onSuccess: (c: Comment) => void 
}) {
    const isReplying = replyingTo === node.id;

    return (
        <div className="flex gap-3 md:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white dark:border-zinc-800 shadow-sm flex-shrink-0">
                <AvatarImage 
                    src={node.userAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${node.guestName || 'guest'}`} 
                    className="object-cover"
                />
                <AvatarFallback>{(node.guestName && node.guestName[0]) || 'G'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-r-2xl rounded-bl-2xl shadow-sm border border-gray-100 dark:border-zinc-800 group-hover:border-orange-100 dark:group-hover:border-orange-900/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{node.guestName || '匿名网友'}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{node.createTime}</span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                onClick={() => setReplyingTo(isReplying ? null : node.id)}
                            >
                                <Reply className="w-3 h-3 mr-1" /> 回复
                            </Button>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm whitespace-pre-wrap break-words">
                        {node.content}
                    </p>
                </div>

                {/* 回复框 */}
                {isReplying && (
                    <div className="mt-4 pl-2 border-l-2 border-orange-100 dark:border-zinc-800">
                        <div className="text-xs text-gray-500 mb-2 pl-2">回复 @{node.guestName}:</div>
                        <CommentForm 
                            postId={postId} 
                            parentId={node.id} 
                            autoFocus 
                            onSuccess={onSuccess} 
                            onCancel={() => setReplyingTo(null)}
                        />
                    </div>
                )}

                {/* 子评论 (递归) */}
                {node.children && node.children.length > 0 && (
                    <div className="mt-4 space-y-4 pl-3 md:pl-8 border-l-2 border-gray-100 dark:border-zinc-800/50">
                        {node.children
                            // .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()) // Backend may already sort, but safe to keep if needed. API returns formatted string time, so sorting by string might be tricky if format changes. Assuming backend order is correct.
                            .map(child => (
                                <CommentItem 
                                    key={child.id} 
                                    node={child} 
                                    postId={postId} 
                                    replyingTo={replyingTo} 
                                    setReplyingTo={setReplyingTo}
                                    onSuccess={onSuccess}
                                />
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
}

// 评论表单组件
function CommentForm({ 
    postId, 
    parentId, 
    onSuccess, 
    onCancel,
    autoFocus = false,
    textareaId
}: { 
    postId: number, 
    parentId?: number, 
    onSuccess: (c: Comment) => void,
    onCancel?: () => void,
    autoFocus?: boolean,
    textareaId?: string
}) {
    const { user } = useAuth();
    const [guestName, setGuestName] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
    
        setSubmitting(true);
        try {
          const nameToSubmit = user ? user.username : guestName;
          const data = await submitComment(postId, content, nameToSubmit, parentId);
          
          if (data.success) {
            setContent(''); 
            toast.success("评论发表成功！");
            onSuccess(data.comment);
          } else {
            toast.error('提交失败：' + data.message);
          }
        } catch (error) {
          console.error(error);
          toast.error('网络错误，请稍后重试');
        } finally {
          setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3 md:gap-4">
            <div className="flex-shrink-0">
               {user ? (
                 <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-gray-100 dark:border-zinc-700">
                    <AvatarImage src={user.avatarUrl} className="object-cover" />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                 </Avatar>
               ) : (
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                   <User className="w-4 h-4 md:w-5 md:h-5" />
                 </div>
               )}
            </div>
            
            <div className="flex-1 space-y-3">
              {!user && (
                  <Input 
                    placeholder="昵称 (必填)" 
                    className="max-w-[200px] h-9 text-sm bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
              )}
              
              <Textarea 
                id={textareaId}
                placeholder={parentId ? "回复..." : "写下你的想法..."}
                className="min-h-[80px] bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                autoFocus={autoFocus}
              />
              
              <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-gray-500">
                        取消
                    </Button>
                )}
                <Button type="submit" size="sm" disabled={submitting || !content.trim()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4">
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-2" /> 发送</>}
                </Button>
              </div>
            </div>
          </div>
        </form>
    );
}
