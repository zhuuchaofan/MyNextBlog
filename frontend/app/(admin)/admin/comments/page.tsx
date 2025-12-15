'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllCommentsAdmin, toggleCommentApproval, deleteCommentAdmin, batchApproveComments, batchDeleteComments } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Trash2, ArrowLeft, MessageSquare, CheckSquare } from 'lucide-react';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

interface AdminComment {
  id: number;
  content: string;
  createTime: string;
  guestName: string;
  isApproved: boolean;
  postTitle?: string;
  postId: number;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'pending'>('all'); // all or pending (isApproved=false)
  
  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setSelectedIds(new Set()); // 翻页或刷新时清空选择
    try {
      const isApproved = filter === 'pending' ? false : undefined;
      const data = await fetchAllCommentsAdmin(page, 20, isApproved);
      if (data.success) {
        setComments(data.comments);
        setTotalCount(data.totalCount);
      } else {
        toast.error("加载评论失败");
      }
    } catch (error) {
        console.error(error);
        toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filter]);

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedIds(new Set(comments.map(c => c.id)));
      } else {
          setSelectedIds(new Set());
      }
  };

  // 单选
  const handleSelectOne = (id: number, checked: boolean) => {
      const newSet = new Set(selectedIds);
      if (checked) {
          newSet.add(id);
      } else {
          newSet.delete(id);
      }
      setSelectedIds(newSet);
  };

  // 批量批准
  const handleBatchApprove = async () => {
      if (selectedIds.size === 0) return;
      try {
          const res = await batchApproveComments(Array.from(selectedIds));
          if (res.success) {
              toast.success(`已批准 ${res.count} 条评论`);
              loadData(); // 重新加载以更新状态
          } else {
              toast.error("批量操作失败");
          }
      } catch (error) {
          toast.error("网络错误");
      }
  };

  // 批量删除
  const handleBatchDelete = async () => {
      if (selectedIds.size === 0) return;
      try {
          const res = await batchDeleteComments(Array.from(selectedIds));
          if (res.success) {
              toast.success(`已删除 ${res.count} 条评论`);
              loadData();
          } else {
              toast.error("批量删除失败");
          }
      } catch (error) {
          toast.error("网络错误");
      }
  };

  // 操作：切换审核状态
  const handleToggleApproval = async (id: number, currentStatus: boolean) => {
    try {
        const res = await toggleCommentApproval(id);
        if (res.success) {
            toast.success(currentStatus ? "评论已隐藏" : "评论已通过审核");
            // 乐观更新 UI
            setComments(prev => prev.map(c => 
                c.id === id ? { ...c, isApproved: !c.isApproved } : c
            ));
            // 如果在“待审核”列表下操作了“通过”，则该条目应该消失
            if (filter === 'pending') {
                 setComments(prev => prev.filter(c => c.id !== id));
            }
        } else {
            toast.error("操作失败");
        }
    } catch (error) {
        toast.error("操作出错");
    }
  };

  // 操作：删除评论
  const handleDelete = async (id: number) => {
      try {
          const res = await deleteCommentAdmin(id);
          if (res.success) {
              toast.success("评论已永久删除");
              setComments(prev => prev.filter(c => c.id !== id));
              setTotalCount(prev => prev - 1);
          } else {
              toast.error("删除失败");
          }
      } catch (error) {
          toast.error("删除出错");
      }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      {/* 头部导航 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            评论管理
        </h1>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center justify-between mb-6">
          <Tabs defaultValue="all" className="w-[400px]" onValueChange={(v) => {
              setFilter(v as 'all' | 'pending');
              setPage(1); // 重置页码
          }}>
            <TabsList>
                <TabsTrigger value="all">全部评论</TabsTrigger>
                <TabsTrigger value="pending">
                    待审核
                </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="text-sm text-gray-500">
             共 {totalCount} 条记录
          </div>
      </div>

      {/* 列表内容 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <TableHead className="w-[50px]">
                        <Checkbox 
                            checked={comments.length > 0 && selectedIds.size === comments.length}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                    </TableHead>
                    <TableHead className="w-[180px]">用户</TableHead>
                    <TableHead>评论内容</TableHead>
                    <TableHead className="w-[150px]">文章</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[150px] text-right">操作</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                             <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
                             </div>
                        </TableCell>
                    </TableRow>
                ) : comments.length === 0 ? (
                    <TableRow>
                         <TableCell colSpan={6} className="h-40 text-center text-gray-500">
                             暂无数据
                         </TableCell>
                    </TableRow>
                ) : (
                    comments.map(comment => (
                        <TableRow key={comment.id} className={selectedIds.has(comment.id) ? "bg-orange-50 dark:bg-orange-900/10" : ""}>
                            <TableCell>
                                <Checkbox 
                                    checked={selectedIds.has(comment.id)}
                                    onCheckedChange={(checked) => handleSelectOne(comment.id, !!checked)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-200">{comment.guestName}</div>
                                <div className="text-xs text-gray-400">{new Date(comment.createTime).toLocaleString()}</div>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-lg break-words text-sm text-gray-600 dark:text-gray-300">
                                    {comment.content}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Link href={`/posts/${comment.postId}`} target="_blank" className="text-xs text-blue-500 hover:underline line-clamp-2">
                                    {comment.postTitle || `Post #${comment.postId}`}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {comment.isApproved ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                        已公开
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                        待审核
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className={comment.isApproved ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                        onClick={() => handleToggleApproval(comment.id, comment.isApproved)}
                                        title={comment.isApproved ? "隐藏评论" : "通过审核"}
                                    >
                                        {comment.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    此操作不可撤销。评论将被永久移除。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>取消</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(comment.id)} className="bg-red-500 hover:bg-red-600">
                                                    确认删除
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
      
      {/* 简单的分页控制 */}
      <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              上一页
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={comments.length < 20}>
              下一页
          </Button>
      </div>

      {/* 底部浮动批量操作栏 */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  已选择 {selectedIds.size} 项
              </span>
              <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700"></div>
              <Button size="sm" onClick={handleBatchApprove} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
                  <CheckSquare className="w-4 h-4 mr-2" /> 批量通过
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="rounded-full">
                        <Trash2 className="w-4 h-4 mr-2" /> 批量删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>确认批量删除？</AlertDialogTitle>
                          <AlertDialogDescription>
                              您即将删除 {selectedIds.size} 条评论，此操作不可撤销。
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
                              确认删除
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-gray-500 rounded-full">
                  取消
              </Button>
          </div>
      )}
    </div>
  );
}
