'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchComments, submitComment, Comment } from '@/lib/api';
import { MessageSquare, User, Send } from 'lucide-react';

export default function CommentsSection({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单状态
  const [guestName, setGuestName] = useState('');
  const [content, setContent] = useState('');

  // 加载评论
  useEffect(() => {
    fetchComments(postId)
      .then(data => {
        if (data.success) setComments(data.comments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const data = await submitComment(postId, content, guestName);
      if (data.success) {
        // 将新评论添加到列表开头
        setComments([data.comment, ...comments]);
        setContent(''); // 清空输入框
        // guestName 不清空，方便连续回复
      } else {
        alert('提交失败：' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-16">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900">评论区 ({comments.length})</h2>
      </div>

      {/* 评论输入框 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex gap-4">
                <Input 
                  placeholder="昵称 (可选)" 
                  className="max-w-[200px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <Textarea 
                placeholder="写下你的想法..." 
                className="min-h-[100px] bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || !content.trim()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
                  {submitting ? '发送中...' : <><Send className="w-4 h-4 mr-2" /> 发送评论</>}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">加载评论中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          还没有人评论，快来抢沙发吧！🛋️
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${comment.guestName}`} />
                <AvatarFallback>{comment.guestName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white p-4 rounded-r-2xl rounded-bl-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{comment.guestName}</span>
                    <span className="text-xs text-gray-400">{comment.createTime}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
