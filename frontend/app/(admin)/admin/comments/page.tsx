'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllCommentsAdmin, toggleCommentApproval, deleteCommentAdmin, batchApproveComments, batchDeleteComments } from '@/lib/api';
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Trash2, CheckSquare, MessageCircle } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'pending'>('all'); // all or pending (isApproved=false)
  
  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 加载数据
  const loadData = useCallback(async () => {
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
    } catch {
        toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      } catch {
          toast.error("操作失败");
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
      } catch {
          toast.error("操作失败");
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
    } catch {
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
      } catch {
          toast.error("删除出错");
      }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl pb-24">
      <AdminPageHeader
        title="评论管理"
        icon={<MessageCircle className="w-5 h-5 text-blue-500" />}
        description="审核和管理文章评论"
        loading={loading}
        stats={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <MessageCircle className="w-3.5 h-3.5" />
            共 {totalCount} 条
          </span>
        }
      />

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
      </div>

      {/* 列表内容 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
        {/* Desktop View: Table */}
        <div className="hidden md:block">
        <Table className="table-fixed">
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <TableHead className="w-[50px]">
                        <Checkbox 
                            checked={comments.length > 0 && selectedIds.size === comments.length}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                    </TableHead>
                    <TableHead className="w-[140px]">用户</TableHead>
                    <TableHead className="min-w-[300px]">评论内容</TableHead>
                    <TableHead className="w-[180px]">文章</TableHead>
                    <TableHead className="w-[80px]">状态</TableHead>
                    <TableHead className="w-[100px] text-center">操作</TableHead>
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
                            <TableCell className="align-top">
                                <div className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[120px]" title={comment.guestName}>{comment.guestName}</div>
                                <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(comment.createTime).toLocaleString()}</div>
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="break-words line-clamp-2 text-sm text-gray-600 dark:text-gray-300" title={comment.content}>
                                    {comment.content}
                                </div>
                            </TableCell>
                            <TableCell className="align-top">
                                <Link href={`/posts/${comment.postId}`} target="_blank" className="text-xs text-blue-500 hover:underline line-clamp-2 block max-w-[160px]" title={comment.postTitle}>
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
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
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

        {/* Mobile View: Cards */}
        <div className="md:hidden">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">加载中...</span>
             </div>
          ) : comments.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                暂无数据
             </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {comments.map(comment => (
                <div key={comment.id} className={`p-4 transition-colors ${selectedIds.has(comment.id) ? "bg-orange-50 dark:bg-orange-900/10" : ""}`}>
                   <div className="flex items-start gap-3 mb-3">
                      <Checkbox 
                          className="mt-1"
                          checked={selectedIds.has(comment.id)}
                          onCheckedChange={(checked) => handleSelectOne(comment.id, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2 mb-1">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${comment.guestName}`} />
                                    <AvatarFallback>{comment.guestName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm text-gray-900 dark:text-gray-200 truncate">{comment.guestName}</span>
                             </div>
                             {comment.isApproved ? (
                                <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">公开</Badge>
                             ) : (
                                <Badge variant="outline" className="text-[10px] h-5 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">待审</Badge>
                             )}
                          </div>
                          <div className="text-xs text-gray-400 mb-2">{new Date(comment.createTime).toLocaleString()}</div>
                          
                          <div className="text-sm text-gray-700 dark:text-gray-300 break-all line-clamp-3 leading-relaxed">
                              {comment.content}
                          </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-2 pl-9">
                       <Link href={`/posts/${comment.postId}`} className="text-xs text-blue-500 truncate max-w-[120px]">
                          {comment.postTitle || `#${comment.postId}`}
                       </Link>
                       
                       <div className="flex gap-1">
                          <Button 
                              size="sm" 
                              variant="ghost" 
                              className={`h-8 px-2 text-xs ${comment.isApproved ? "text-orange-500" : "text-green-600"}`}
                              onClick={() => handleToggleApproval(comment.id, comment.isApproved)}
                          >
                              {comment.isApproved ? "隐藏" : "通过"}
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:text-red-600">
                                      删除
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                      <AlertDialogDescription>不可撤销。</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>取消</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(comment.id)} className="bg-red-500">删除</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                       </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 分页控制 */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading}
            className="w-full md:w-auto"
          >
              上一页
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            第 {page} / {Math.ceil(totalCount / 20) || 1} 页 (共 {totalCount} 条)
          </span>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => p + 1)} 
            disabled={comments.length < 20 || loading}
            className="w-full md:w-auto"
          >
              下一页
          </Button>
      </div>

      {/* 底部浮动批量操作栏 */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl rounded-full px-4 py-3 md:px-6 flex items-center gap-2 md:gap-4 animate-in slide-in-from-bottom-5 w-[90vw] md:w-auto max-w-2xl overflow-x-auto no-scrollbar justify-between md:justify-start">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  已选 {selectedIds.size}
              </span>
              <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 flex-shrink-0"></div>
              <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" onClick={handleBatchApprove} className="bg-green-600 hover:bg-green-700 text-white rounded-full whitespace-nowrap px-3 text-xs md:text-sm">
                      <CheckSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> 
                      <span className="hidden sm:inline">批量</span>通过
                  </Button>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="rounded-full whitespace-nowrap px-3 text-xs md:text-sm">
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> 
                            <span className="hidden sm:inline">批量</span>删除
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
                  
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-gray-500 rounded-full whitespace-nowrap px-2">
                      取消
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
}
