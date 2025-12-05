'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from '@/components/MarkdownEditor';
import { fetchCategories, createPost, Category } from '@/lib/api';
import { ChevronLeft, Save } from 'lucide-react';
import { toast } from "sonner";

export default function NewPostPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 鉴权与加载分类
  useEffect(() => {
    if (!token || user?.role !== 'Admin') {
      router.push('/login');
      return;
    }

    fetchCategories().then(data => {
      if (data.success) setCategories(data.data);
    });
  }, [token, user, router]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('请输入文章标题');
      return;
    }

    setLoading(true);
    try {
      const res = await createPost(token!, { 
        title, 
        content, 
        categoryId 
      });
      
      if (res.success) {
        toast.success('发布成功！正在跳转...');
        setTimeout(() => {
            router.push('/admin'); 
        }, 1500);
      } else {
        toast.error('发布失败: ' + res.message);
      }
    } catch (error: any) {
      console.error('Create post error:', error);
      toast.error('网络错误: ' + (error.message || "请检查后端服务"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回
           </Button>
           <h1 className="text-2xl font-bold text-gray-900">撰写新文章</h1>
         </div>
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
           {loading ? '发布中...' : <><Save className="w-4 h-4 mr-2" /> 发布文章</>}
         </Button>
      </div>

      <div className="grid gap-6">
        {/* 标题输入 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title" className="text-lg font-semibold">文章标题</Label>
            <span className={`text-sm ${title.length > 90 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {title.length}/100
            </span>
          </div>
          <Input 
            id="title" 
            maxLength={100}
            className="text-2xl py-6 font-medium border-transparent bg-white shadow-sm hover:border-orange-200 focus:border-orange-500 transition-all"
            placeholder="请输入引人入胜的标题..." 
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* 分类选择 (简单的 Select) */}
        <div className="space-y-2">
           <Label className="font-semibold">选择分类</Label>
           <div className="flex gap-2 flex-wrap">
             {categories.map(cat => (
               <Button 
                 key={cat.id} 
                 type="button"
                 variant={categoryId === cat.id ? 'default' : 'outline'}
                 onClick={() => setCategoryId(cat.id)}
                 className={`rounded-full ${categoryId === cat.id ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
               >
                 {cat.name}
               </Button>
             ))}
             {categories.length === 0 && <span className="text-gray-400 text-sm">暂无分类</span>}
           </div>
        </div>

        {/* Markdown 编辑器 */}
        <div className="space-y-2">
           <Label className="font-semibold">正文内容</Label>
           <MarkdownEditor value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
