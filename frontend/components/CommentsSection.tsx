'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchComments, Comment } from '@/lib/api';
import { submitCommentAction } from '@/lib/actions/comment';
import { MessageSquare, User, Send, Reply, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';

// RSC 模式：首屏数据由 Server Component 传入
interface CommentsSectionProps {
  postId: number;
  initialComments: Comment[];    // 服务端获取的首屏评论
  initialTotalCount: number;     // 总评论数
  initialHasMore: boolean;       // 是否有更多
}

export default function CommentsSection({ 
  postId, 
  initialComments, 
  initialTotalCount, 
  initialHasMore 
}: CommentsSectionProps) {
  const [allComments, setAllComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(false); // 首屏无需 loading
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  
  // 回复状态：当前正在回复哪个评论 ID
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // 递归插入新评论
  const addCommentToTree = useCallback((nodes: Comment[], newComment: Comment): Comment[] => {
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
  }, []);

  // 监听 MobileBottomBar 发出的评论成功事件
  useEffect(() => {
    const handleCommentAdded = (e: CustomEvent<Comment>) => {
      setAllComments(prev => addCommentToTree(prev, e.detail));
      setTotalCount(prev => prev + 1);
    };

    window.addEventListener('comment-added', handleCommentAdded as EventListener);
    return () => {
      window.removeEventListener('comment-added', handleCommentAdded as EventListener);
    };
  }, [addCommentToTree]);

  // 加载更多评论（仅在用户点击时触发）
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const data = await fetchComments(postId, nextPage);
      if (data.success) {
        // 去重合并
        setAllComments(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newComments = data.comments.filter((c: Comment) => !existingIds.has(c.id));
          return [...prev, ...newComments];
        });
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  }, [postId, page]);

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
                <Button variant="ghost" onClick={loadMore} disabled={loading} className="text-gray-500 dark:text-gray-400 hover:text-orange-500">
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

// 将嵌套树结构扁平化为单层列表
function flattenReplies(children: Comment[], parentName: string): { comment: Comment; replyTo: string }[] {
    const result: { comment: Comment; replyTo: string }[] = [];
    
    for (const child of children) {
        result.push({ comment: child, replyTo: parentName });
        if (child.children && child.children.length > 0) {
            result.push(...flattenReplies(child.children, child.guestName || '匿名网友'));
        }
    }
    
    return result;
}

// 单个评论项组件 (YouTube 风格：单层嵌套)
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
    
    // 将所有嵌套回复扁平化
    const flattenedReplies = node.children && node.children.length > 0 
        ? flattenReplies(node.children, node.guestName || '匿名网友')
        : [];

    return (
        <div className="space-y-4">
            {/* 根评论 */}
            <div className="flex gap-3 group">
                <Avatar className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0">
                    <AvatarImage 
                        src={node.userAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${node.guestName || 'guest'}`} 
                        className="object-cover"
                    />
                    <AvatarFallback>{(node.guestName && node.guestName[0]) || 'G'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {node.guestName || '匿名网友'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400">
                            {new Date(node.createTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                        {node.content}
                    </p>

                    <div className="mt-2 flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs text-gray-400 hover:text-orange-500 hover:bg-transparent -ml-2"
                            onClick={() => setReplyingTo(isReplying ? null : node.id)}
                        >
                            <Reply className="w-3.5 h-3.5 mr-1" /> 回复
                        </Button>
                    </div>

                    {isReplying && (
                        <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">回复 @{node.guestName}:</div>
                            <CommentForm 
                                postId={postId} 
                                parentId={node.id} 
                                autoFocus 
                                onSuccess={onSuccess} 
                                onCancel={() => setReplyingTo(null)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 所有回复（扁平化显示，只有一层缩进） */}
            {flattenedReplies.length > 0 && (
                <div className="ml-6 md:ml-8 pl-4 border-l-2 border-gray-100 dark:border-zinc-800 space-y-4">
                    {flattenedReplies.map(({ comment, replyTo }) => (
                        <ReplyItem 
                            key={comment.id} 
                            comment={comment} 
                            replyTo={replyTo}
                            postId={postId}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            onSuccess={onSuccess}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// 单个回复项组件（扁平化后的回复）
function ReplyItem({
    comment,
    replyTo,
    postId,
    replyingTo,
    setReplyingTo,
    onSuccess
}: {
    comment: Comment,
    replyTo: string,
    postId: number,
    replyingTo: number | null,
    setReplyingTo: (id: number | null) => void,
    onSuccess: (c: Comment) => void
}) {
    const isReplying = replyingTo === comment.id;

    return (
        <div className="flex gap-3 group animate-in fade-in duration-300">
            <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage 
                    src={comment.userAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${comment.guestName || 'guest'}`} 
                    className="object-cover"
                />
                <AvatarFallback>{(comment.guestName && comment.guestName[0]) || 'G'}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {comment.guestName || '匿名网友'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(comment.createTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                    <span className="text-orange-500 font-medium">@{replyTo}</span>{' '}
                    {comment.content}
                </p>

                <div className="mt-1.5 flex items-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-gray-400 hover:text-orange-500 hover:bg-transparent -ml-2"
                        onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                    >
                        <Reply className="w-3 h-3 mr-1" /> 回复
                    </Button>
                </div>

                {isReplying && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">回复 @{comment.guestName}:</div>
                        <CommentForm 
                            postId={postId} 
                            parentId={comment.id} 
                            autoFocus 
                            onSuccess={onSuccess} 
                            onCancel={() => setReplyingTo(null)}
                        />
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
          // 使用 Server Action 提交评论（会触发 revalidatePath）
          const data = await submitCommentAction(postId, content, nameToSubmit, parentId);
          
          if (data.success) {
            setContent(''); 
            toast.success("评论发表成功！");
            onSuccess(data.comment);
          } else {
            toast.error('提交失败：' + data.message);
          }
        } catch (error) {
          console.error(error);
          toast.error('操作失败，请稍后重试');
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
