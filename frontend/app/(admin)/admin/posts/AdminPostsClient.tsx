'use client';

/**
 * AdminPostsClient 组件：文章管理列表页的客户端交互部分
 * --------------------------------------------------------------------------------
 * 此组件接收由 Server Component 预取的初始数据，并处理：
 * - 分页切换（客户端获取后续页面）
 * - 删除文章（确认对话框 + API 调用）
 * - 切换文章可见性（发布/隐藏）
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import type { AdminPostItem, PaginationMeta } from '@/lib/data';

interface AdminPostsClientProps {
  initialPosts: AdminPostItem[];
  initialMeta: PaginationMeta;
}

export default function AdminPostsClient({ initialPosts, initialMeta }: AdminPostsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 中读取页码参数
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  
  // 状态管理
  const [posts, setPosts] = useState<AdminPostItem[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(urlPage);
  const [hasMore, setHasMore] = useState(initialMeta.hasMore);
  const [totalCount, setTotalCount] = useState(initialMeta.totalCount);
  const [totalPages, setTotalPages] = useState(initialMeta.totalPages);
  const [statsPublished, setStatsPublished] = useState<number | null>(null);
  const [statsDraft, setStatsDraft] = useState<number | null>(null);
  const pageSize = 10;
  
  // 删除确认对话框相关状态
  const [postToDelete, setPostToDelete] = useState<AdminPostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 当 URL 页码变化时（用户使用浏览器前进/后退），同步状态
  useEffect(() => {
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [urlPage, page]);

  // 当页码变化且不是初始页时，加载新数据
  useEffect(() => {
    // 初始数据已由 Server Component 提供，无需重复加载
    if (page === initialMeta.page) return;
    
    loadPosts(page);
  }, [page, initialMeta.page]);

  // 加载统计数据
  useEffect(() => {
    fetch('/api/admin/stats/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsPublished(data.data.posts.published);
          setStatsDraft(data.data.posts.draft);
        }
      })
      .catch(console.error);
  }, []);

  // 核心函数：加载文章列表
  const loadPosts = (currentPage: number) => {
    setLoading(true);
    fetchPostsWithAuth(currentPage, pageSize)
      .then(data => {
        if (data.success) {
           setPosts(data.data);
           if (data.meta) {
             setHasMore(data.meta.hasMore);
             setTotalCount(data.meta.totalCount);
             setTotalPages(data.meta.totalPages);
           } else {
             setHasMore(data.data.length === pageSize);
           }
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('文章列表加载失败');
        setLoading(false);
      });
  };

  // 执行文章删除操作
  const executeDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deletePost(postToDelete.id);
      if (res.success) {
        toast.success('文章删除成功');
        loadPosts(page);
      } else {
        toast.error('文章删除失败: ' + res.message);
      }
    } catch {
      toast.error('操作失败，请稍后重试');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  // 切换文章可见性（发布/隐藏）
  const handleToggleVisibility = async (post: AdminPostItem) => {
    try {
      const res = await togglePostVisibility(post.id);

      if (res.success) {
        const newIsHidden = res.isHidden ?? !post.isHidden;
        toast.success(newIsHidden ? '文章已设为草稿（隐藏）' : '文章已发布（公开）');
        
        // 乐观更新 UI
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === post.id ? { ...p, isHidden: newIsHidden } : p
        ));
      } else {
        toast.error('操作失败: ' + res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('操作失败，请稍后重试');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 页面标题和"写新文章"按钮 */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
           {/* 返回按钮 */}
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回
           </Button>
           <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        </div>
        {/* 第二行：统计徽章 + 按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
           {statsPublished !== null && (
             <div className="flex items-center gap-2">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                 <Eye className="w-3.5 h-3.5" />
                 已发布 {statsPublished}
               </span>
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                 <EyeOff className="w-3.5 h-3.5" />
                 草稿 {statsDraft}
               </span>
             </div>
           )}
        <Link href="/admin/posts/new">
          <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> 写新文章
          </Button>
        </Link>
        </div>
      </div>

      {/* 加载状态或文章列表 */}
      {loading && posts.length === 0 ? (
         <div className="p-10 text-center text-gray-500 dark:text-gray-400">文章列表加载中...</div>
      ) : (
        <>
          {/* 桌面端表格显示 */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-x-auto transition-colors">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <TableHead className="w-[30%] text-gray-500 dark:text-gray-400">标题</TableHead>
                  <TableHead className="w-[10%] text-gray-500 dark:text-gray-400">分类</TableHead>
                  <TableHead className="w-[15%] text-gray-500 dark:text-gray-400">系列</TableHead>
                  <TableHead className="w-[8%] text-gray-500 dark:text-gray-400">作者</TableHead>
                  <TableHead className="w-[10%] text-gray-500 dark:text-gray-400">发布时间</TableHead>
                  <TableHead className="w-[7%] text-gray-500 dark:text-gray-400">状态</TableHead>
                  <TableHead className="w-[20%] text-center text-gray-500 dark:text-gray-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className={`${post.isHidden ? 'bg-gray-50/30 dark:bg-zinc-800/30 text-gray-400 dark:text-gray-500' : 'dark:text-gray-300'} border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50`}>
                    <TableCell className="truncate" title={post.title}>
                      <Link href={`/posts/${post.id}`} target="_blank" className="hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-2 group transition-colors max-w-full">
                        <span className="truncate">{post.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="font-normal bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{post.categoryName || '未分类'}</Badge>
                    </TableCell>
                    <TableCell className="truncate">
                      {post.seriesName ? (
                        <span className="text-sm text-orange-600 dark:text-orange-400 truncate block" title={`#${post.seriesOrder} ${post.seriesName}`}>#{post.seriesOrder} {post.seriesName}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate">{post.authorName}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-500 whitespace-nowrap">{new Date(post.createTime).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>
                      <Badge variant={post.isHidden ? "outline" : "default"} className={post.isHidden ? "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-700" : "bg-green-500 hover:bg-green-600 text-white border-transparent"}>
                        {post.isHidden ? '草稿' : '已发布'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleToggleVisibility(post)}
                        >
                          {post.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Link href={`/admin/posts/${post.id}/edit?returnPage=${page}`}>
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

          {/* 移动端卡片显示 */}
          <div className="grid gap-3 md:hidden">
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
                    <span>{new Date(post.createTime).toLocaleDateString('zh-CN')}</span>
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
                    <Link href={`/admin/posts/${post.id}/edit?returnPage=${page}`} className="flex-1">
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

      {/* 分页控制 */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-4">
         <Button 
           variant="outline" 
           disabled={page <= 1 || loading}
           onClick={() => {
             const newPage = Math.max(1, page - 1);
             setPage(newPage);
             router.replace(`/admin/posts?page=${newPage}`);
           }}
           className="w-full md:w-auto border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
         >
           上一页
         </Button>
         
         <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
           第 {page} / {totalPages || 1} 页 (共 {totalCount} 篇)
         </span>

         <Button 
           variant="outline" 
           disabled={!hasMore || loading}
           onClick={() => {
             const newPage = page + 1;
             setPage(newPage);
             router.replace(`/admin/posts?page=${newPage}`);
           }}
           className="w-full md:w-auto border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"
         >
           下一页
         </Button>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              文章 <span className="font-bold text-gray-900 dark:text-gray-100">&ldquo;{postToDelete?.title}&rdquo;</span> 将被移至回收站，可在回收站中恢复或永久删除。
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
