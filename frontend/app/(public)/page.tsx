import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Tag, Github } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG, PETS } from "@/lib/constants";
import PostList from "./_components/PostList";
import { cookies } from 'next/headers'; // 导入 cookies 工具

// 移除 force-dynamic，允许 Next.js 自动优化
// export const dynamic = "force-dynamic";

// 获取初始文章列表 (Server-Side)
async function getInitialPosts() {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:5095';
  
  // 获取 Token 以便识别管理员
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }

  try {
    // 使用 fetch API 获取数据。
    // 如果是管理员 (有Token)，则 revalidate: 0 (实时获取，包含隐藏文章)
    // 如果是普通用户，则 revalidate: 60 (ISR 缓存，仅公开文章)
    const res = await fetch(`${backendUrl}/api/posts?page=1&pageSize=10`, {
       headers,
       next: { revalidate: token ? 0 : 60 } 
    });
    
    // 如果响应状态码不是 2xx，记录错误并返回空数据
    if (!res.ok) {
        console.error(`Fetch posts failed: ${res.status} ${res.statusText}`);
        return { data: [], meta: { hasMore: false } };
    }
    
    const json = await res.json();
    return json.success ? json : { data: [], meta: { hasMore: false } };
  } catch (e) {
    console.error("Failed to fetch posts:", e);
    return { data: [], meta: { hasMore: false } };
  }
}

// 获取热门标签 (Server-Side)
async function getPopularTags() {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:5095';
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    // 构造请求头，如果有 token 则带上
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token.value}`;
    }

    const res = await fetch(`${backendUrl}/api/tags/popular`, {
       headers,
       cache: 'no-store' // 标签保持实时更新
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (e) {
    console.error("Failed to fetch tags:", e);
    return [];
  }
}

// 获取站点配置内容 (Server-Side)
async function getSiteContent(key: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:5095';
  try {
    const res = await fetch(`${backendUrl}/api/site-content/${key}`, {
      next: { revalidate: 60 } // 缓存 60 秒
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data.value : null;
  } catch {
    return null;
  }
}

// 首页组件 (Server Component)
// 这是一个 Async 组件，可以直接在组件内部使用 `await` 获取数据。
// 数据获取发生在服务端，浏览器接收到的是已经填充好数据的 HTML。
export default async function Home() {
  // 并行获取文章、标签和主页内容
  const [postsData, popularTags, homepageIntro, authorJson] = await Promise.all([
    getInitialPosts(),
    getPopularTags(),
    getSiteContent('homepage_intro'),
    getSiteContent('about_author')
  ]);

  // 解析作者信息
  let author = {
    name: SITE_CONFIG.author,
    avatar: SITE_CONFIG.avatar,
    social: SITE_CONFIG.social
  };
  if (authorJson) {
    try {
      author = JSON.parse(authorJson);
    } catch { /* 使用默认值 */ }
  }

  // 检查是否登录 (简单判断 Token)
  // 后端会进行实际的权限验证，所以这里主要用于控制 UI 显示
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const isAdmin = !!token; // 暂时简单视为管理员 (为了显示管理按钮)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
      
      {/* Hero Section (顶部横幅) */}
      <div className="relative bg-gradient-to-br from-orange-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-orange-100/50 dark:shadow-black/50 border border-white dark:border-zinc-800 mb-16 isolate overflow-hidden transition-colors duration-300">
        {/* 背景装饰 (模糊圆球) */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-gradient-to-tr from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          {/* 左侧文字区 */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-400 text-sm font-medium shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>探索 • 记录 • 分享</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              {PETS.qiuqiu.name} & {PETS.pudding.name}的 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 dark:from-orange-400 dark:to-pink-500">
                技术后花园
              </span>
              <span className="ml-2 text-4xl md:text-6xl align-middle">🏡</span>
            </h1>
            
            <p 
              className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl"
              dangerouslySetInnerHTML={{ 
                __html: homepageIntro || '欢迎来到这里！' 
              }}
            />
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <Link href="/archive">
                <Button className="rounded-full h-12 px-8 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all">
                  开始阅读
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="rounded-full h-12 px-8 border-gray-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:border-orange-200 dark:hover:border-orange-900 text-gray-700 dark:text-gray-300">
                  认识博主
                </Button>
              </Link>
            </div>
          </div>

          {/* 右侧图片区 (Hero Image / Illustration) */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-white dark:from-orange-900/20 dark:to-zinc-800/20 rounded-full animate-pulse"></div>
            <div className="relative w-full h-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-zinc-700/50 shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
               <Image 
                 src={PETS.qiuqiu.avatar} 
                 alt={PETS.qiuqiu.name} 
                 fill 
                 priority={true} // 优先级加载 (LCP 优化)
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                 className="object-cover rounded-3xl transition-transform duration-700 group-hover:scale-110" 
               />
               <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl overflow-hidden shadow-2xl animate-bounce duration-1000">
                 <Image 
                   src={PETS.pudding.avatar} 
                   alt={PETS.pudding.name} 
                   fill 
                   sizes="20vw" // Smaller image
                   className="object-cover" 
                 />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* 主内容区: 文章列表 (占用 8 列) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="flex w-3 h-3 bg-orange-500 rounded-full ring-4 ring-orange-100 dark:ring-orange-900/50"></span>
              最新发布
            </h2>
            <Link href="/archive" className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 将服务端获取的数据通过 props 传递给客户端组件 PostList */}
          <PostList 
             initialPosts={postsData.data} 
             initialHasMore={postsData.meta ? postsData.meta.hasMore : postsData.data.length === 10} 
             isAdmin={isAdmin}
             defaultAuthor={author.name}
          />
        </div>

        {/* 侧边栏 (仅桌面端显示，占用 4 列) */}
        <div className="hidden lg:block lg:col-span-4 space-y-8">
           {/* 博主简介小部件 */}
           <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm text-center relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 opacity-50"></div>
              <div className="relative z-10 -mt-4 mb-4">
                 <div className="w-20 h-20 mx-auto bg-white dark:bg-zinc-800 rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden bg-cover bg-center" style={{backgroundImage: `url('${author.avatar}')`}}></div>
                 </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{author.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Fullstack Developer</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                写代码，撸猫，记录生活。
                <br/>
                这里是我存放思想碎片的地方。
              </p>
              <div className="flex justify-center gap-3">
                 <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-gray-200 dark:border-zinc-700 dark:hover:bg-zinc-800" asChild>
                   <Link href={author.social?.github || SITE_CONFIG.social.github} target="_blank">
                     <Github className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                   </Link>
                 </Button>
              </div>
           </div>

           {/* 热门标签小部件 */}
           <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> 热门话题
              </h3>
              <div className="flex flex-wrap gap-2">
                 {popularTags.length === 0 ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500">暂无标签</span>
                 ) : (
                    popularTags.map((tag: string) => (
                     <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                       <Badge variant="secondary" className="bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors rounded-lg px-3 py-1.5 font-normal">
                         # {tag}
                       </Badge>
                     </Link>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}