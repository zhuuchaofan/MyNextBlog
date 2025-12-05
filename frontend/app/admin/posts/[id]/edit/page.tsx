'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from '@/components/MarkdownEditor';
import TagInput from '@/components/TagInput';
import { fetchCategories, updatePost, Category } from '@/lib/api';
import { ChevronLeft, Save } from 'lucide-react';
import { toast } from "sonner";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  // 解包 params Promise (Next.js 15)
  const { id } = use(params); 
  const { token, user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 鉴权、加载分类、回显文章
  useEffect(() => {
    if (!token || user?.role !== 'Admin') {
      // router.push('/login'); // 这里为了防闪烁先注释，或者放在外层 layout 做
      return;
    }

    const init = async () => {
      try {
        // 1. 加载分类
        const catRes = await fetchCategories();
        if (catRes.success) setCategories(catRes.data);

        // 2. 加载文章详情
        // 复用 Public API (注意：这里请求的是 Next.js 代理后的地址，不是 .NET 端口)
        const postRes = await fetch(`/api/backend/posts/${id}`);
        const postData = await postRes.json();
        
        if (postData.success) {
          const p = postData.data;
          setTitle(p.title);
          setContent(p.content);
          setCategoryId(p.categoryId === 0 ? undefined : p.categoryId);
          setTags(p.tags || []); // Populate tags
        } else {
          toast.error('文章不存在');
          router.push('/admin/posts');
        }
      } catch (err) {
        toast.error('加载失败');
      } finally {
        setFetching(false);
      }
    };

    init();
  }, [token, user, router, id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('请输入文章标题');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePost(token!, parseInt(id), { 
        title, 
        content, 
        categoryId,
        tags 
      });
      
      if (res.success) {
        toast.success('更新成功！');
        router.push('/admin/posts'); 
      } else {
        toast.error('更新失败: ' + res.message);
      }
    } catch (error: any) {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">加载文章数据中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回列表
           </Button>
           <h1 className="text-2xl font-bold text-gray-900">编辑文章</h1>
         </div>
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
           {loading ? '保存中...' : <><Save className="w-4 h-4 mr-2" /> 保存修改</>}
         </Button>
      </div>

      <div className="grid gap-6">
        {/* 标题输入 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title" className="text-lg font-semibold">文章标题</Label>
            <span className={`text-sm ${title.length > 40 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {title.length}/50
            </span>
          </div>
          <Input 
            id="title" 
            maxLength={50}
            className="text-2xl py-6 font-bold border-transparent bg-white shadow-sm hover:border-orange-200 focus:border-orange-500 transition-all"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* 分类选择 */}
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
           </div>
        </div>

        {/* 标签输入 */}
        <div className="space-y-2">
           <Label className="font-semibold">文章标签</Label>
           <TagInput value={tags} onChange={setTags} />
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
