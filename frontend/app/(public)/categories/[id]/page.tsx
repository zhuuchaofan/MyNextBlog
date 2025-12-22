import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Folder } from "lucide-react";
import { cookies } from 'next/headers'; // 导入 cookies 用于获取 Token

// 定义文章数据的接口 (精简版，用于分类列表展示)
interface Post {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  author: string;
  category: string;
  categoryId: number;
  coverImage?: string;
  isHidden?: boolean; // 新增：用于显示隐藏标记
}

/**
 * getCategoryData 函数：用于在服务端获取分类下的文章和分类详情
 */
async function getCategoryData(categoryId: string) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5095';
  const postsUrl = `${baseUrl}/api/posts?categoryId=${categoryId}`;
  const categoryUrl = `${baseUrl}/api/categories/${categoryId}`;
  
  // 获取 Token 以识别管理员
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }
  
  try {
    const [postsRes, categoryRes] = await Promise.all([
      fetch(postsUrl, { headers, next: { revalidate: token ? 0 : 60 } }), // 管理员不缓存
      fetch(categoryUrl, { headers, next: { revalidate: 60 } })
    ]);
    
    let posts: Post[] = [];
    let categoryName = `分类 ${categoryId}`; // 默认分类名称

    // 处理文章列表的响应
    if (postsRes.ok) {
      const postsJson = await postsRes.json();
      if (postsJson.success) {
        // 适配数据接口 (后端返回的是 categoryName，前端 Post 接口中可能是 category)
        posts = postsJson.data.map((p: any) => ({
          ...p,
          author: p.authorName,
          category: p.categoryName
        }));
      }
    } else {
      console.error(`Fetch posts failed: ${postsRes.status} for URL: ${postsUrl}`);
    }

    // 处理分类详情的响应
    if (categoryRes.ok) {
      const categoryJson = await categoryRes.json();
      if (categoryJson.success) categoryName = categoryJson.data.name;
    } else {
       // 如果获取分类详情失败，但文章列表不为空，尝试从第一篇文章中提取分类名作为回退。
       if (posts.length > 0) categoryName = posts[0].category;
       console.error(`Fetch category failed: ${categoryRes.status} for URL: ${categoryUrl}`);
    }

    return { posts, categoryName };
  } catch (error) {
    console.error(`Fetch category data error`, error);
    return { posts: [], categoryName: 'Unknown' }; // 发生错误时返回空数据和未知分类名
  }
}

/**
 * CategoryPage 组件：分类详情页面
 * --------------------------------------------------------------------------------
 * 这是一个 Next.js Server Component，用于显示某个特定分类下的所有文章。
 * 路由参数 `id` 表示分类的 ID。
 */
export default async function CategoryPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  // 在服务端调用 `getCategoryData` 获取文章列表和分类名称。
  const { posts, categoryName } = await getCategoryData(resolvedParams.id);

  // 如果需要更严格的 404 处理 (例如分类 ID 不存在)，可以在这里调用 `notFound()`
  // if (posts.length === 0 && categoryName === 'Unknown') {
  //   notFound();
  // }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8">
      {/* 页面头部：显示分类名称和文章数量 */}
      <div className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Folder className="w-6 h-6" /> {/* 分类图标 */}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{categoryName}</h1>
          <p className="text-gray-500 dark:text-gray-400">收录了 {posts.length} 篇文章</p>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="grid gap-6">
        {posts.length === 0 ? (
          // 如果该分类下没有文章，显示提示信息
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
            <p className="text-gray-400 dark:text-gray-500">该分类下暂时没有文章 🍂</p>
            <Link href="/">
              <Button variant="link" className="mt-2 text-orange-600 dark:text-orange-400">返回首页</Button>
            </Link>
          </div>
        ) : (
          // 遍历并渲染文章卡片
          posts.map((post) => (
            <Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow border-gray-100 dark:border-zinc-800 group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm ${post.isHidden ? 'opacity-70 grayscale-[0.5] border-dashed border-gray-300' : ''}`}>
              <div className="flex flex-col md:flex-row">
                  {/* 封面图片 */}
                  {post.coverImage && (
                    <div className="md:w-48 h-48 md:h-auto bg-gray-100 dark:bg-zinc-800 relative overflow-hidden group-hover:cursor-pointer">
                      <Link href={`/posts/${post.id}`} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </Link>
                    </div>
                  )}
                  
                  {/* 文章信息 */}
                  <div className="flex-1 flex flex-col p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isHidden && (
                          <Badge variant="destructive" className="text-xs border-dashed border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            Hidden
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/50">{post.category}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-xl md:text-2xl transition-colors">
                        <Link href={`/posts/${post.id}`} className="hover:text-orange-600 dark:hover:text-orange-400 hover:underline decoration-orange-300 underline-offset-4 cursor-pointer">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 mb-4">
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2 md:line-clamp-3">
                        {post.excerpt}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 p-0">
                      <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-zinc-800 px-0 cursor-pointer">
                          阅读全文 <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
