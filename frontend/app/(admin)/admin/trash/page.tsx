'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDeletedPosts, restorePost, permanentDeletePost } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Undo2, Trash2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";

interface DeletedPost {
  id: number;
  title: string;
  createTime: string;
  categoryName: string;
  authorName: string;
  isHidden: boolean;
}

/**
 * 回收站页面：管理已删除的文章
 */
export default function TrashPage() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<DeletedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;
  
  // 永久删除确认对话框
  const [postToDelete, setPostToDelete] = useState<DeletedPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDeletedPosts(page);
  }, [page]);

  const loadDeletedPosts = (currentPage: number) => {
    setLoading(true);
    fetchDeletedPosts(currentPage, pageSize)
      .then(data => {
        if (data.success) {
          setPosts(data.data);
          if (data.meta) {
            setHasMore(data.meta.hasMore);
            setTotalCount(data.meta.totalCount);
            setTotalPages(data.meta.totalPages);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('回收站加载失败');
        setLoading(false);
      });
  };

  // 恢复文章
  const handleRestore = async (post: DeletedPost) => {
    try {
      const res = await restorePost(post.id);
      if (res.success) {
        toast.success('文章已恢复');
        loadDeletedPosts(page);
      } else {
        toast.error('恢复失败: ' + res.message);
      }
    } catch {
      toast.error('网络错误');
    }
  };

  // 永久删除
  const executePermanentDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const res = await permanentDeletePost(postToDelete.id);
      if (res.success) {
        toast.success('文章已永久删除');
        loadDeletedPosts(page);
      } else {
        toast.error('删除失败: ' + res.message);
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">回收站</h1>
          <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
            {totalCount} 篇
          </Badge>
        </div>
      </div>

      {/* 警告提示 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">回收站中的文章不会在前台显示</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">您可以恢复文章或永久删除。永久删除将清除云端图片，无法恢复。</p>
        </div>
      </div>

      {/* 内容 */}
      {loading && posts.length === 0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
          🗑️ 回收站是空的
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <TableHead className="text-gray-500 dark:text-gray-400">标题</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">分类</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">作者</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">创建时间</TableHead>
                  <TableHead className="text-right text-gray-500 dark:text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <span className="line-through">{post.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400">{post.categoryName || '未分类'}</Badge>
                    </TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell>{new Date(post.createTime).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => handleRestore(post)}
                        >
                          <Undo2 className="w-3 h-3 mr-1" /> 恢复
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                          onClick={() => setPostToDelete(post)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> 永久删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片 */}
          <div className="grid gap-4 md:hidden">
            {posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-medium text-gray-400 dark:text-gray-500 line-through flex-1">{post.title}</h3>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-3">
                  <span>{post.authorName}</span>
                  <span>{new Date(post.createTime).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => handleRestore(post)}
                  >
                    <Undo2 className="w-3 h-3 mr-2" /> 恢复
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1 h-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                    onClick={() => setPostToDelete(post)}
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> 永久删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
          <Button 
            variant="outline" 
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="w-full md:w-auto border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
          >
            上一页
          </Button>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            第 {page} / {totalPages} 页
          </span>

          <Button 
            variant="outline" 
            disabled={!hasMore || loading}
            onClick={() => setPage(p => p + 1)}
            className="w-full md:w-auto border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
          >
            下一页
          </Button>
        </div>
      )}

      {/* 永久删除确认对话框 */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> 永久删除确认
            </AlertDialogTitle>
            <AlertDialogDescription>
              文章 <span className="font-bold text-gray-900 dark:text-gray-100">&ldquo;{postToDelete?.title}&rdquo;</span> 将被<span className="text-red-600 font-medium">永久删除</span>，包括关联的云端图片，此操作无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                executePermanentDelete();
              }} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? '删除中...' : '确认永久删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
