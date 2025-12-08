'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from '@/components/MarkdownEditor';
import TagInput from '@/components/TagInput';
import CreateCategoryDialog from '@/components/CreateCategoryDialog';
import { fetchCategories, updatePost, Category, getPostWithAuth } from '@/lib/api';
import { ChevronLeft, Save, Plus } from 'lucide-react';
import { toast } from "sonner";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      // router.push('/login'); 
    }

    const init = async () => {
      try {
        const catRes = await fetchCategories();
        if (catRes.success) setCategories(catRes.data);

        const postData = await getPostWithAuth(parseInt(id));
        
        if (postData.success) {
          const p = postData.data;
          setTitle(p.title);
          setContent(p.content);
          setCategoryId(p.categoryId === 0 ? undefined : p.categoryId);
          setTags(p.tags || []);
        } else {
          toast.error('文章不存在或已隐藏');
          router.push('/admin/posts');
        }
      } catch (err) {
        toast.error('加载失败');
      } finally {
        setFetching(false);
      }
    };

    init();
  }, [user, router, id]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('请输入文章标题');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePost(parseInt(id), { 
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

  if (fetching) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">加载文章数据中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回列表
           </Button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">编辑文章</h1>
         </div>
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
           {loading ? '保存中...' : <><Save className="w-4 h-4 mr-2" /> 保存修改</>}
         </Button>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title" className="text-lg font-semibold dark:text-gray-200">文章标题</Label>
            <span className={`text-sm ${title.length > 40 ? 'text-red-500 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
              {title.length}/50
            </span>
          </div>
          <Input 
            id="title" 
            maxLength={50}
            className="text-2xl py-6 font-medium border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-500 dark:focus:border-orange-600 transition-all dark:text-gray-100 dark:placeholder:text-zinc-600"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
           <Label className="font-semibold dark:text-gray-200">选择分类</Label>
           <div className="flex gap-2 flex-wrap">
             {categories.map(cat => (
               <Button 
                 key={cat.id} 
                 type="button"
                 variant={categoryId === cat.id ? 'default' : 'outline'}
                 onClick={() => setCategoryId(cat.id)}
                 className={`rounded-full ${categoryId === cat.id ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
               >
                 {cat.name}
               </Button>
             ))}
             <Button 
               type="button"
               variant="outline" 
               className="rounded-full border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400"
               onClick={() => setIsCreateCategoryOpen(true)}
             >
               <Plus className="w-4 h-4 mr-1" /> 新建
             </Button>
           </div>
        </div>

        <CreateCategoryDialog 
          open={isCreateCategoryOpen} 
          onOpenChange={setIsCreateCategoryOpen} 
          onCreated={(newCat) => {
            setCategories([...categories, newCat]);
            setCategoryId(newCat.id);
          }}
        />

        <div className="space-y-2">
           <Label className="font-semibold dark:text-gray-200">文章标签</Label>
           <TagInput value={tags} onChange={setTags} />
        </div>

        <div className="space-y-2">
           <Label className="font-semibold dark:text-gray-200">正文内容</Label>
           <MarkdownEditor value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
