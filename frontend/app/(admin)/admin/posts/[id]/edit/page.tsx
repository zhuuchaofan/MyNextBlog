"use client"; // 标记为客户端组件，因为需要状态管理、事件处理和 useEffect

import { useState, useEffect, use } from "react"; // `use` 是 React 18+ 的 hook，用于从 Promise 中同步解包值
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // 导入认证上下文钩子
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "@/components/MarkdownEditor"; // 自定义 Markdown 编辑器组件
import TagInput from "@/components/TagInput"; // 自定义标签输入组件
import CreateCategoryDialog from "@/components/CreateCategoryDialog"; // 创建分类对话框组件
import CreateSeriesDialog from "@/components/CreateSeriesDialog"; // Create Series Dialog
import {
  fetchCategories,
  updatePost,
  Category,
  getPostWithAuth,
  fetchAllSeries,
  fetchNextSeriesOrder,
  Series,
} from "@/lib/api"; // 导入 API 请求函数和类型
import { ChevronLeft, Save, Plus } from "lucide-react"; // 图标库
import { toast } from "sonner"; // Toast 通知组件
import { Switch } from "@/components/ui/switch"; // 开关组件

/**
 * EditPostPage 组件：编辑文章页面
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，用于管理员编辑现有文章。
 * 它会在组件加载时从后端获取文章的现有数据，并提供一个表单进行修改。
 */
export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // `use(params)`: Next.js 15 的新特性，在 Server Component 中异步获取路由参数后，
  // 可以在 Client Component 中使用 `use` hook 同步解包 Promise 结果。
  const { id } = use(params); // 获取当前文章的 ID
  const { user } = useAuth(); // 获取当前登录用户
  const router = useRouter(); // Next.js 路由实例
  const searchParams = useSearchParams(); // 获取 URL 查询参数
  const returnPage = searchParams.get("returnPage") || "1"; // 从 URL 中获取返回页码，默认第 1 页

  // 状态管理：用于存储表单字段的值
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false); // 控制表单提交的加载状态
  const [fetching, setFetching] = useState(true); // 控制文章数据初始加载状态
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false); // 控制新建分类对话框的显示
  const [isCreateSeriesOpen, setIsCreateSeriesOpen] = useState(false); // Control create series dialog display

  // Series states
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesId, setSeriesId] = useState<number | undefined>(undefined);
  const [seriesOrder, setSeriesOrder] = useState<number>(0);

  // 文章可见性状态
  const [isHidden, setIsHidden] = useState<boolean>(false);

  // `useEffect` 钩子，在组件挂载后执行，用于：
  // 1. 权限检查
  // 2. 初始化表单数据（获取分类和文章详情）
  useEffect(() => {
    // 权限检查（与新建页面类似）
    if (user && user.role !== "Admin") {
      // router.push('/login');
    }

    const init = async () => {
      try {
        // 1. 获取所有分类列表
        const catRes = await fetchCategories();
        if (catRes.success) setCategories(catRes.data);

        // 2. 获取当前编辑文章的详情
        // `getPostWithAuth` 用于获取管理员权限下的文章详情（包含隐藏文章）
        const postData = await getPostWithAuth(parseInt(id)); // 将字符串 ID 转换为整数

        if (postData.success) {
          const p = postData.data;
          // 用获取到的数据初始化表单状态
          setTitle(p.title);
          setContent(p.content);
          // 如果 categoryId 为 0，则视为未分类，设为 undefined
          setCategoryId(p.categoryId === 0 ? undefined : p.categoryId);
          setTags(p.tags || []); // 如果没有标签，设为空数组
          // Load existing series info if available
          setSeriesId(p.seriesId || undefined);
          setSeriesOrder(p.seriesOrder || 0);
          // 加载文章可见性状态
          setIsHidden(p.isHidden ?? false);
        } else {
          toast.error("文章不存在或无权编辑"); // 如果文章不存在或无权编辑，显示错误并跳转
          router.push("/admin/posts");
        }
      } catch {
        toast.error("加载文章数据失败");
      } finally {
        setFetching(false); // 结束初始加载状态
      }
    };

    init();

    // Load Series list
    fetchAllSeries().then((res) => {
      if (res.success) setSeriesList(res.data);
    });
  }, [user, router, id]); // 依赖 `user`, `router`, `id`

  // Auto-fill Series Order when series is selected
  const handleSeriesChange = async (newSeriesId: number | undefined) => {
    setSeriesId(newSeriesId);
    if (newSeriesId) {
      const res = await fetchNextSeriesOrder(newSeriesId);
      if (res.success) {
        setSeriesOrder(res.data);
      }
    } else {
      setSeriesOrder(0);
    }
  };

  // 处理文章更新提交
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning("请输入文章标题");
      return;
    }

    setLoading(true);
    try {
      // 调用 API 更新文章
      const res = await updatePost(parseInt(id), {
        title,
        content,
        categoryId,
        tags,
        seriesId,
        seriesOrder: seriesId ? seriesOrder : 0,
        isHidden, // 传递文章可见性状态
      });

      if (res.success) {
        toast.success("文章更新成功！");
        // 跳转回文章管理列表页，并保留原始页码
        router.push(`/admin/posts?page=${returnPage}`);
      } else {
        toast.error("更新失败: " + res.message);
      }
    } catch (error: unknown) {
      toast.error(
        "操作失败: " + ((error as Error).message || "请检查网络连接")
      );
    } finally {
      setLoading(false);
    }
  };

  // 如果文章数据正在加载，显示加载提示
  if (fetching)
    return (
      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
        文章数据加载中...
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 顶部操作栏：返回按钮和保存修改按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* 返回列表按钮 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-500 dark:text-gray-400"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回列表
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            编辑文章
          </h1>
        </div>
        {/* 保存修改按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading ? (
            "保存中..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> 保存修改
            </>
          )}
        </Button>
      </div>

      {/* 文章编辑表单区域 (与新建文章页面结构类似) */}
      {/* [&>*]:min-w-0 让 Grid 子项可以收缩到比内容更小，解决长标题导致的溢出问题 */}
      <div className="grid gap-6 [&>*]:min-w-0">
        {/* 标题输入框 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="title"
              className="text-lg font-semibold dark:text-gray-200"
            >
              文章标题
            </Label>
            <span
              className={`text-sm ${
                title.length > 40
                  ? "text-red-500 font-bold"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {title.length}/50
            </span>
          </div>
          <Input
            id="title"
            maxLength={50}
            className="w-full text-2xl py-6 font-medium border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:border-orange-200 dark:hover:border-orange-800 focus:border-orange-500 dark:focus:border-orange-600 transition-all dark:text-gray-100 dark:placeholder:text-zinc-600"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 文章可见性控制 */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700">
          <div className="space-y-0.5 min-w-0">
            <Label className="font-semibold dark:text-gray-200">文章状态</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {isHidden ? "隐藏中，仅管理员可见" : "已公开"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-sm ${
                !isHidden
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              公开
            </span>
            <Switch checked={isHidden} onCheckedChange={setIsHidden} />
            <span
              className={`text-sm ${
                isHidden
                  ? "text-orange-600 dark:text-orange-400 font-medium"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              隐藏
            </span>
          </div>
        </div>

        {/* 分类选择区域 */}
        <div className="space-y-2">
          <Label className="font-semibold dark:text-gray-200">选择分类</Label>
          <div className="w-full flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={categoryId === cat.id ? "default" : "outline"}
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-full ${
                  categoryId === cat.id
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
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

        {/* 系列选择区域 */}
        <div className="space-y-2">
          <Label className="font-semibold dark:text-gray-200">
            所属系列 (可选)
          </Label>
          <div className="flex gap-2 items-center w-full">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={seriesId || ""}
              onChange={(e) =>
                handleSeriesChange(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">-- 不属于任何系列 --</option>
              {seriesList.map((s) => {
                const totalCount = s.postCount + (s.hiddenPostCount || 0);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({totalCount}篇{s.hiddenPostCount ? `，含${s.hiddenPostCount}篇隐藏` : ''})
                  </option>
                );
              })}
            </select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setIsCreateSeriesOpen(true)}
              title="新建系列"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {seriesId && (
              <div className="flex items-center gap-2 w-32 shrink-0">
                <span className="text-sm whitespace-nowrap">第几篇:</span>
                <Input
                  type="number"
                  min="1"
                  className="w-16"
                  value={seriesOrder}
                  onChange={(e) =>
                    setSeriesOrder(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* 新建分类对话框组件 */}
        <CreateCategoryDialog
          open={isCreateCategoryOpen}
          onOpenChange={setIsCreateCategoryOpen}
          onCreated={(newCat) => {
            setCategories([...categories, newCat]);
            setCategoryId(newCat.id);
          }}
        />

        {/* Create Series Dialog */}
        <CreateSeriesDialog
          open={isCreateSeriesOpen}
          onOpenChange={setIsCreateSeriesOpen}
          onCreated={(newSeries) => {
            setSeriesList([...seriesList, newSeries]);
            handleSeriesChange(newSeries.id); // Auto select and set order to 1
          }}
        />

        {/* 标签输入区域 */}
        <div className="space-y-2">
          <Label className="font-semibold dark:text-gray-200">文章标签</Label>
          <TagInput value={tags} onChange={setTags} />
        </div>

        {/* 正文内容区域 (Markdown 编辑器) */}
        <div className="space-y-2">
          <Label className="font-semibold dark:text-gray-200">正文内容</Label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
