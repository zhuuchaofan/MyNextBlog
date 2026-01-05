'use client'; // 标记为客户端组件，因为需要状态管理、事件处理和 useEffect

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext'; // Unused
import { fetchPostsWithAuth, deletePost, togglePostVisibility } from '@/lib/api'; // 导入 API 请求函数
import { Button } from "@/components/ui/button"; // shadcn/ui 按钮组件
import { Badge } from "@/components/ui/badge"; // shadcn/ui 徽章组件
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // shadcn/ui 表格组件
import { // shadcn/ui 警告对话框组件，用于删除确认
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, ChevronLeft, ExternalLink, Eye, EyeOff } from 'lucide-react'; // 图标库
import { toast } from "sonner"; // Toast 通知组件，用于显示操作结果

// 定义文章数据接口，匹配后端返回的结构
interface Post {
  id: number;
  title: string;
  createTime: string;
  categoryName: string;
  authorName: string;
  isHidden: boolean;
  seriesName?: string;   // New: Series name
  seriesOrder: number;   // New: Order in series
}

/**
 * AdminPostsPage 包装组件：使用 Suspense 包裹以支持 useSearchParams
 */
export default function AdminPostsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500 dark:text-gray-400">加载中...</div>}>
      <AdminPostsContent />
    </Suspense>
  );
}

/**
 * AdminPostsContent 组件：文章管理列表页的实际内容
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，用于管理员查看、编辑、删除和管理所有文章。
 * 它会从后端获取所有文章（包括隐藏的草稿），并提供分页功能。
 */
function AdminPostsContent() {
  // const { user } = useAuth(); // Unused
  const router = useRouter(); // Next.js 路由实例，用于页面跳转
  const searchParams = useSearchParams(); // 获取 URL 查询参数
  
  // 从 URL 中读取页码参数，用于从编辑页返回时恢复原始页码
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  
  // 状态管理
  const [posts, setPosts] = useState<Post[]>([]); // 存储文章列表
  const [loading, setLoading] = useState(true); // 控制加载状态
  const [page, setPage] = useState(urlPage); // 当前页码，从 URL 初始化
  const [hasMore, setHasMore] = useState(false); // 是否有更多数据可加载 (分页)
  const [totalCount, setTotalCount] = useState(0); // 文章总数
  const [totalPages, setTotalPages] = useState(0); // 总页数
  const [statsPublished, setStatsPublished] = useState<number | null>(null); // 已发布数
  const [statsDraft, setStatsDraft] = useState<number | null>(null); // 草稿数
  const pageSize = 10; // 每页显示的文章数量
  
  // 删除确认对话框相关状态
  const [postToDelete, setPostToDelete] = useState<Post | null>(null); // 待删除的文章
  const [isDeleting, setIsDeleting] = useState(false); // 删除操作的加载状态

  // `useEffect` 钩子，在 `page` 状态变化时（即用户切换页码时）重新加载文章
  useEffect(() => {
    loadPosts(page);
  }, [page]);

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
    setLoading(true); // 开始加载，显示加载状态
    // 调用 API 获取文章列表。`fetchPostsWithAuth` 会包含所有文章（包括隐藏的），
    // 且其内部会通过 Next.js 的 Middleware 自动注入认证 Token。
    fetchPostsWithAuth(currentPage, pageSize)
      .then(data => {
        if (data.success) {
           setPosts(data.data); // 更新文章列表
           // 根据后端返回的 meta 信息判断是否有更多数据
           if (data.meta) {
             setHasMore(data.meta.hasMore);
             setTotalCount(data.meta.totalCount); // 更新总数
             setTotalPages(data.meta.totalPages); // 更新总页数
           } else {
             // 如果没有 meta 信息，简单判断是否有下一页 (默认每页 pageSize 条，如果刚好取满则可能有更多)
             setHasMore(data.data.length === pageSize);
           }
        }
        setLoading(false); // 加载完成
      })
      .catch(() => {
        toast.error('文章列表加载失败'); // 显示错误通知
        setLoading(false);
      });
  };

  // 执行文章删除操作
  const executeDelete = async () => {
    if (!postToDelete) return; // 如果没有指定文章，则不执行

    setIsDeleting(true); // 设置删除加载状态
    try {
      // 调用 API 删除文章
      const res = await deletePost(postToDelete.id);
      if (res.success) {
        toast.success('文章删除成功'); // 显示成功通知
        loadPosts(page); // 重新加载当前页的文章列表以更新 UI
      } else {
        toast.error('文章删除失败: ' + res.message); // 显示失败通知
      }
    } catch {
      toast.error('网络错误，请稍后重试'); // 捕获网络异常
    } finally {
      setIsDeleting(false); // 结束删除加载状态
      setPostToDelete(null); // 关闭删除确认对话框
    }
  };

  // 切换文章可见性（发布/隐藏）
  const handleToggleVisibility = async (post: Post) => {
    try {
      // 调用 API 切换文章的 isHidden 状态
      const res = await togglePostVisibility(post.id);

      if (res.success) {
        // 根据后端返回的最新 isHidden 状态更新 UI
        const newIsHidden = res.isHidden ?? !post.isHidden;
        toast.success(newIsHidden ? '文章已设为草稿（隐藏）' : '文章已发布（公开）');
        
        // 乐观更新 UI：直接更新列表中的对应文章状态，避免重新加载整个列表
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 页面标题和“写新文章”按钮 */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
           {/* 返回按钮 */}
           <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
             <ChevronLeft className="w-4 h-4" />
             <span className="sr-only">返回</span>
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
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <TableHead className="text-gray-500 dark:text-gray-400">标题</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">分类</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400">系列</TableHead>
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
                      {/* 点击标题在新窗口查看文章详情 */}
                      <Link href={`/posts/${post.id}`} target="_blank" className="hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-2 group transition-colors">
                        {post.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="font-normal bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{post.categoryName || '未分类'}</Badge>
                    </TableCell>
                    <TableCell>
                      {post.seriesName ? (
                        <span className="text-sm text-orange-600 dark:text-orange-400">#{post.seriesOrder} {post.seriesName}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-500">{new Date(post.createTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {/* 文章状态徽章 */}
                      <Badge variant={post.isHidden ? "outline" : "default"} className={post.isHidden ? "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-700" : "bg-green-500 hover:bg-green-600 text-white border-transparent"}>
                        {post.isHidden ? '草稿' : '已发布'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* 切换可见性按钮 */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleToggleVisibility(post)}
                        >
                          {post.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        {/* 编辑按钮 - 携带当前页码参数 */}
                        <Link href={`/admin/posts/${post.id}/edit?returnPage=${page}`}>
                          <Button variant="outline" size="sm" className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800">
                            <Edit className="w-3 h-3 mr-1" /> 编辑
                          </Button>
                        </Link>
                        {/* 删除按钮 */}
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

          {/* 移动端卡片显示 (小屏幕下显示为卡片列表) */}
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
                    {/* 编辑按钮 - 携带当前页码参数 */}
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
           disabled={page <= 1 || loading} // 禁用条件：第一页或正在加载
           onClick={() => {
             const newPage = Math.max(1, page - 1);
             setPage(newPage);
             router.replace(`/admin/posts?page=${newPage}`); // 同步更新 URL
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
           disabled={!hasMore || loading} // 禁用条件：没有更多数据或正在加载
           onClick={() => {
             const newPage = page + 1;
             setPage(newPage);
             router.replace(`/admin/posts?page=${newPage}`); // 同步更新 URL
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
                e.preventDefault(); // 阻止默认的表单提交行为
                executeDelete();    // 执行删除操作
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
