'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchPostsWithAuth, deletePost, togglePostVisibility } from '@/lib/api';
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
import { Edit, Trash2, Plus, ChevronLeft, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";

interface Post {
  id: number;
  title: string;
  createTime: string;
  categoryName: string;
  authorName: string;
  isHidden: boolean;
}

export default function AdminPostsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;
  
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPosts(page);
  }, [page]);

  const loadPosts = (currentPage: number) => {
    setLoading(true);
    fetchPostsWithAuth(currentPage, pageSize)
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

  const executeDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deletePost(postToDelete.id);
      if (res.success) {
        toast.success('删除成功');
        loadPosts(page); 
      } else {
        toast.error('删除失败: ' + res.message);
      }
    } catch (error) {
      toast.error('网络错误');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null); 
    }
  };

  const handleToggleVisibility = async (post: Post) => {
    try {
      const res = await togglePostVisibility(post.id);

      if (res.success) {
        const newIsHidden = res.isHidden ?? !post.isHidden;
        toast.success(newIsHidden ? '文章已设为草稿' : '文章已发布');
        
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === post.id ? { ...p, isHidden: newIsHidden } : p
        ));
      } else {
        toast.error('操作失败: ' + res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('网络错误，请稍后重试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回
           </Button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        </div>
        <Link href="/admin/posts/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> 写新文章
          </Button>
        </Link>
      </div>

      {loading && posts.length === 0 ? (
         <div className="p-10 text-center text-gray-500 dark:text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <TableHead className="text-gray-500 dark:text-gray-400">标题</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">分类</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">作者</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">发布时间</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">状态</TableHead>
                  <TableHead className="text-right text-gray-500 dark:text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className={`${post.isHidden ? 'bg-gray-50/30 dark:bg-zinc-800/30 text-gray-400 dark:text-gray-500' : 'dark:text-gray-300'} border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50`}>
                    <TableCell>
                      <Link href={`/posts/${post.id}`} target="_blank" className="hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-2 group transition-colors">
                        {post.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="font-normal bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{post.categoryName || '未分类'}</Badge>
                    </TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-500">{new Date(post.createTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={post.isHidden ? "outline" : "default"} className={post.isHidden ? "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-700" : "bg-green-500 hover:bg-green-600 text-white border-transparent"}>
                        {post.isHidden ? '草稿' : '已发布'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleToggleVisibility(post)}
                        >
                          {post.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Link href={`/admin/posts/${post.id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                            <Edit className="w-3 h-3 mr-1" /> 编辑
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300"
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

          <div className="grid gap-4 md:hidden">
            {posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-3 transition-colors">
                 <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight flex-1">
                      <Link href={`/posts/${post.id}`} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <Badge variant={post.isHidden ? "outline" : "default"} className={post.isHidden ? "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400" : "bg-green-500 hover:bg-green-600 text-white"}>
                      {post.isHidden ? '草稿' : '已发布'}
                    </Badge>
                 </div>
                 <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-3">
                    <span>{post.authorName}</span>
                    <span>{new Date(post.createTime).toLocaleDateString()}</span>
                 </div>
                 <div className="flex gap-3 pt-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => handleToggleVisibility(post)}
                    >
                      {post.isHidden ? <Eye className="w-3 h-3 mr-2" /> : <EyeOff className="w-3 h-3 mr-2" />}
                      {post.isHidden ? '发布' : '隐藏'}
                    </Button>
                    <Link href={`/admin/posts/${post.id}/edit`} className="flex-1">
                       <Button variant="outline" size="sm" className="w-full h-9 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                         <Edit className="w-3 h-3 mr-2" /> 编辑
                       </Button>
                    </Link>
                    <Button 
                       variant="destructive" 
                       size="sm" 
                       className="flex-1 h-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
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

      <div className="flex justify-between items-center mt-6">
         <Button 
           variant="outline" 
           disabled={page <= 1 || loading} 
           onClick={() => setPage(p => Math.max(1, p - 1))}
           className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
         >
           上一页
         </Button>
         <span className="text-sm text-gray-500 dark:text-gray-400">第 {page} 页</span>
         <Button 
           variant="outline" 
           disabled={!hasMore || loading} 
           onClick={() => setPage(p => p + 1)}
           className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
         >
           下一页
         </Button>
      </div>

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              文章 <span className="font-bold text-gray-900 dark:text-gray-100">“{postToDelete?.title}”</span> 将被永久删除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
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
