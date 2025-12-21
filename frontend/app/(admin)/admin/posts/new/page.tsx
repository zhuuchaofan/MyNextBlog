'use client'; // 标记为客户端组件，因为需要状态管理、事件处理和 useEffect

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // 导入认证上下文钩子
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from '@/components/MarkdownEditor'; // 自定义 Markdown 编辑器组件
import TagInput from '@/components/TagInput';             // 自定义标签输入组件
import CreateCategoryDialog from '@/components/CreateCategoryDialog'; // 创建分类对话框组件
import { fetchCategories, createPost, Category, Series } from '@/lib/api'; // 导入 API 请求函数和类型
import { ChevronLeft, Save, Plus } from 'lucide-react'; // 图标库
import { toast } from "sonner"; // Toast 通知组件

/**
 * NewPostPage 组件：新建文章页面
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，提供了一个表单界面供管理员撰写和发布新文章。
 * 它集成了 Markdown 编辑器、标签输入和分类选择功能。
 */
export default function NewPostPage() {
  const { user } = useAuth(); // 获取当前登录用户（用于权限检查，非严格必要，因为路由已被中间件保护）
  const router = useRouter(); // Next.js 路由实例
  
  // 状态管理：用于存储表单字段的值
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]); // 存储已输入的标签
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined); // 存储选中的分类 ID
  const [categories, setCategories] = useState<Category[]>([]); // 存储所有可用的分类列表
  const [loading, setLoading] = useState(false); // 控制表单提交的加载状态
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false); // 控制新建分类对话框的显示
  
  // Series states
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesId, setSeriesId] = useState<number | undefined>(undefined);
  const [seriesOrder, setSeriesOrder] = useState<number>(0);

  // `useEffect` 钩子，在组件挂载后执行一次，用于：
  // 1. 权限检查（尽管路由已被 middleware 保护，这里可作为额外确认或用于非管理员提示）
  // 2. 加载文章分类列表
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      // 如果用户已登录但不是管理员，理论上 middleware 已经会重定向到首页了。
      // router.push('/'); // 实际项目中，通常会重定向到权限不足的提示页或首页
    }

    // 异步获取所有分类列表，并更新 `categories` 状态
    fetchCategories().then(data => {
      if (data.success) setCategories(data.data);
    });
    
    // Load Series
    import('@/lib/api').then(({ fetchAllSeries }) => {
        fetchAllSeries().then(res => {
            if(res.success) setSeriesList(res.data);
        });
    });

  }, [user, router]); // 依赖 `user` 和 `router`

  // Auto-fill Series Order when series is selected
  const handleSeriesChange = async (newSeriesId: number | undefined) => {
    setSeriesId(newSeriesId);
    if (newSeriesId) {
      // Fetch next order
      const { fetchNextSeriesOrder } = await import('@/lib/api');
      const res = await fetchNextSeriesOrder(newSeriesId);
      if (res.success) {
        setSeriesOrder(res.data);
      }
    } else {
      setSeriesOrder(0);
    }
  };

  // 处理文章提交（发布）
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('请输入文章标题'); // 标题为空的验证
      return;
    }

    setLoading(true); // 开始加载，禁用按钮
    try {
      // 调用 API 发布新文章
      const res = await createPost({ 
        title, 
        content, 
        categoryId,
        tags, // 传递标签列表
        seriesId, // Optional Series
        seriesOrder: seriesId ? seriesOrder : 0
      });
      
      if (res.success) {
        toast.success('发布成功！正在跳转到文章管理列表...'); // 显示成功通知
        setTimeout(() => {
            router.push('/admin/posts'); // 成功后跳转到文章管理列表页
        }, 1500);
      } else {
        toast.error('发布失败: ' + res.message); // 显示失败通知
      }
    } catch (error: unknown) {
      console.error('Create post error:', error);
      toast.error('网络错误: ' + ((error as Error).message || "请检查后端服务")); // 捕获网络错误
    } finally {
      setLoading(false); // 结束加载状态
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 顶部操作栏：返回按钮和发布文章按钮 */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
           {/* 返回上一页 */}
           <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
             <ChevronLeft className="w-4 h-4 mr-1" /> 返回
           </Button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">撰写新文章</h1>
         </div>
         {/* 发布文章按钮 */}
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
           {loading ? '发布中...' : <><Save className="w-4 h-4 mr-2" /> 发布文章</>}
         </Button>
      </div>

      {/* 文章编辑表单区域 */}
      <div className="grid gap-6">
        {/* 标题输入框 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="title" className="text-lg font-semibold dark:text-gray-200">文章标题</Label>
            <span className={`text-sm ${title.length > 40 ? 'text-red-500 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
              {title.length}/50 {/* 标题字数限制提示 */}
            </span>
          </div>
          <Input 
            id="title" 
            maxLength={50} // 最大输入长度
            className="text-2xl py-6 font-medium border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-500 dark:focus:border-orange-600 transition-all dark:text-gray-100 dark:placeholder:text-zinc-600"
            placeholder="请输入引人入胜的标题..." 
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* 分类及系列选择区域 (Grid Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Category */}
            <div className="space-y-2">
               <Label className="font-semibold dark:text-gray-200">选择分类</Label>
               <div className="flex gap-2 flex-wrap">
                 {/* 渲染所有分类按钮 */}
                 {categories.map(cat => (
                   <Button 
                     key={cat.id} 
                     type="button"
                     variant={categoryId === cat.id ? 'default' : 'outline'} // 选中状态样式
                     onClick={() => setCategoryId(cat.id)} // 点击选中分类
                     className={`rounded-full ${categoryId === cat.id ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                   >
                     {cat.name}
                   </Button>
                 ))}
                 {/* 新建分类按钮 */}
                 <Button 
                   type="button"
                   variant="outline" 
                   className="rounded-full border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400"
                   onClick={() => setIsCreateCategoryOpen(true)} // 打开新建分类对话框
                 >
                   <Plus className="w-4 h-4 mr-1" /> 新建
                 </Button>
               </div>
            </div>

            {/* Right: Series (Optional) */}
            <div className="space-y-2">
                <Label className="font-semibold dark:text-gray-200">所属系列 (可选)</Label>
                <div className="flex gap-4 items-center">
                    <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={seriesId || ''}
                        onChange={(e) => handleSeriesChange(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">-- 不属于任何系列 --</option>
                        {seriesList.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    
                    {seriesId && (
                        <div className="flex items-center gap-2 w-32 shrink-0">
                            <span className="text-sm whitespace-nowrap">第几篇:</span>
                            <Input 
                                type="number" 
                                min="1"
                                className="w-16" 
                                value={seriesOrder} 
                                onChange={e => setSeriesOrder(Math.max(1, Number(e.target.value)))} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 新建分类对话框组件 */}
        <CreateCategoryDialog 
          open={isCreateCategoryOpen} 
          onOpenChange={setIsCreateCategoryOpen} 
          onCreated={(newCat) => { // 新建分类成功后的回调
            setCategories([...categories, newCat]); // 将新分类添加到列表中
            setCategoryId(newCat.id); // 自动选中新创建的分类
          }}
        />

        {/* 标签输入区域 */}
        <div className="space-y-2">
           <Label className="font-semibold dark:text-gray-200">文章标签</Label>
           <TagInput value={tags} onChange={setTags} /> {/* 标签输入组件 */}
        </div>

        {/* 正文内容区域 (Markdown 编辑器) */}
        <div className="space-y-2">
           <Label className="font-semibold dark:text-gray-200">正文内容</Label>
           <MarkdownEditor value={content} onChange={setContent} /> {/* Markdown 编辑器组件 */}
        </div>
      </div>
    </div>
  );
}
