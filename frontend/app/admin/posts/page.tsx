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
  
  // 控制删除弹窗的状态
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载文章
  useEffect(() => {
    if (!token) return;
    loadPosts();
  }, [token]);

  const loadPosts = () => {
    setLoading(true);
    fetchPostsWithAuth(token!)
      .then(data => {
        if (data.success) setPosts(data.data);
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

  if (loading && posts.length === 0) return <div className="p-8 text-center">Loading...</div>;

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[50px]">ID</TableHead>
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
                <TableCell className="font-medium">{post.id}</TableCell>
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
                      onClick={() => setPostToDelete(post)} // 点击时只设置状态，不执行逻辑
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