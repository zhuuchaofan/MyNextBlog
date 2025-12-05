'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchPostsWithAuth, deletePost } from '@/lib/api';
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
import { Edit, Trash2, Plus, ChevronLeft, ExternalLink } from 'lucide-react';
import { toast } from "sonner";

interface Post {
  id: number;
  title: string;
  createTime: string;
  category: string;
  author: string;
}

export default function AdminPostsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;
  
  // 控制删除弹窗的状态
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载文章
  useEffect(() => {
    if (!token) return;
    loadPosts(page);
  }, [token, page]);

  const loadPosts = (currentPage: number) => {
    setLoading(true);
    fetchPostsWithAuth(token!, currentPage, pageSize)
      .then(data => {
        if (data.success) {
           setPosts(data.data);
           if (data.meta) {
             setHasMore(data.meta.hasMore);
           } else {
             setHasMore(data.data.length === pageSize);
           }
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('加载失败');
        setLoading(false);
      });
  };

  // 真正执行删除的函数
  const executeDelete = async () => {
    if (!postToDelete || !token) return;

    setIsDeleting(true);
    try {
      const res = await deletePost(token, postToDelete.id);
      if (res.success) {
        toast.success('删除成功');
        // 重新加载当前页，或者简单过滤
        setPosts(posts.filter(p => p.id !== postToDelete.id));
      } else {
        toast.error('删除失败: ' + res.message);
      }
    } catch (error) {
      toast.error('网络错误');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null); // 关闭弹窗
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回
           </Button>
           <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        </div>
        <Link href="/admin/posts/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> 写新文章
          </Button>
        </Link>
      </div>

      {loading && posts.length === 0 ? (
         <div className="p-10 text-center text-gray-500">加载中...</div>
      ) : (
        <>
          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link href={`/posts/${post.id}`} target="_blank" className="hover:text-orange-600 flex items-center gap-2 group">
                        {post.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="font-normal">{post.category || '未分类'}</Badge>
                    </TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell className="text-gray-500">{new Date(post.createTime).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/posts/${post.id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="w-3 h-3 mr-1" /> 编辑
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700"
                          onClick={() => setPostToDelete(post)} 
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View: Cards */}
          <div className="grid gap-4 md:hidden">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                 <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight flex-1">
                      <Link href={`/posts/${post.id}`} className="hover:text-orange-600 transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <Badge variant="secondary" className="shrink-0">{post.category || '未分类'}</Badge>
                 </div>
                 <div className="text-xs text-gray-500 flex items-center justify-between border-b border-gray-50 pb-3">
                    <span>{post.author}</span>
                    <span>{new Date(post.createTime).toLocaleDateString()}</span>
                 </div>
                 <div className="flex gap-3 pt-1">
                    <Link href={`/admin/posts/${post.id}/edit`} className="flex-1">
                       <Button variant="outline" size="sm" className="w-full h-9">
                         <Edit className="w-3 h-3 mr-2" /> 编辑
                       </Button>
                    </Link>
                    <Button 
                       variant="destructive" 
                       size="sm" 
                       className="flex-1 h-9 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700"
                       onClick={() => setPostToDelete(post)}
                    >
                       <Trash2 className="w-3 h-3 mr-2" /> 删除
                    </Button>
                 </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
         <Button 
           variant="outline" 
           disabled={page <= 1 || loading} 
           onClick={() => setPage(p => Math.max(1, p - 1))}
         >
           上一页
         </Button>
         <span className="text-sm text-gray-500">第 {page} 页</span>
         <Button 
           variant="outline" 
           disabled={!hasMore || loading} 
           onClick={() => setPage(p => p + 1)}
         >
           下一页
         </Button>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              文章 <span className="font-bold text-gray-900">“{postToDelete?.title}”</span> 将被永久删除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // 阻止默认关闭，直到异步操作完成
                executeDelete();
              }} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}