import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Mail, Twitter, Code2, Database, Layout, Server, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
// 导入站点配置、宠物信息、技能列表、书籍列表等常量数据
import { SITE_CONFIG, PETS, SKILLS, BOOKS } from "@/lib/constants"; 

// 图标映射：将技能数据中的字符串图标名称映射到实际的 Lucide React 图标组件
const iconMap: Record<string, React.ReactNode> = {
  Server: <Server className="w-4 h-4" />,
  Layout: <Layout className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Database: <Database className="w-4 h-4" />,
  Terminal: <Terminal className="w-4 h-4" />,
  Code2: <Code2 className="w-4 h-4" />,
};

/**
 * AboutPage 组件：关于页面
 * --------------------------------------------------------------------------------
 * 这是一个静态内容页面，展示博主的个人信息、技能栈、在读/想读的书籍以及猫咪介绍。
 * 所有内容都通过 `lib/constants.ts` 文件进行配置，便于维护。
 * 作为 Server Component，此页面在服务端渲染，内容直接以 HTML 形式发送到浏览器。
 */
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-12">
      
      {/* 头部区域：博主介绍 */}
      <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
        {/* 博主头像区域 */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
           {/* 背景装饰光晕 */}
           <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
           {/* 头像图片 */}
           <div className="relative w-full h-full bg-white rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center text-8xl select-none bg-cover bg-center" style={{backgroundImage: `url("${SITE_CONFIG.avatar}")`}}>
             {/* Placeholder if image fails */}
           </div>
           {/* 装饰性小图标 */}
           <div className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg text-2xl border border-orange-100">
             👨‍💻
           </div>
        </div>
        
        {/* 文字介绍区域 */}
        <div className="text-center md:text-left flex-1">
          <h1 className="text-4xl md::text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
            你好，我是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">朱超凡</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
            {SITE_CONFIG.description} {/* 从常量中读取描述 */}
            <br/>
            热衷于构建高性能 Web 应用，目前专注于 <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-mono text-base">.NET</code> 与 <code className="bg-black dark:bg-white text-white dark:text-black px-1 py-0.5 rounded font-mono text-base">Next.js</code> 生态。
          </p>
          {/* 社交媒体链接按钮 */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <Button className="rounded-full gap-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" asChild>
              <Link href={SITE_CONFIG.social.github} target="_blank">
                 <Github className="w-4 h-4" /> Github
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full gap-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" asChild>
              <Link href={SITE_CONFIG.social.twitter} target="_blank">
                <Twitter className="w-4 h-4" /> Twitter
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full gap-2 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800" asChild>
              <Link href={`mailto:${SITE_CONFIG.social.email}`}>
                <Mail className="w-4 h-4" /> 联系我
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-12">
        
        {/* 左侧列：技能树和阅读列表 */}
        <div className="md:col-span-4 space-y-12">
          {/* 技能树部分 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
              技能树
            </h2>
            <div className="space-y-4">
              {SKILLS.map(skill => (
                <div key={skill.name} className="group">
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       {iconMap[skill.icon]} {skill.name} {/* 根据 iconMap 显示对应图标 */}
                     </span>
                     <span className="text-gray-400 dark:text-gray-500 font-mono">{skill.level}%</span>
                   </div>
                   {/* 技能进度条 */}
                   <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                       style={{ width: `${skill.level}%` }}
                     ></div>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* 在读/想读的书籍部分 */}
          <section>
             <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              在读/想读
            </h2>
            <div className="flex flex-wrap gap-2">
               {BOOKS.map(book => (
                 <Badge key={book} variant="secondary" className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-default">
                   📖 {book}
                 </Badge>
               ))}
            </div>
          </section>
        </div>

        {/* 右侧列：关于博客和猫主子介绍 */}
        <div className="md:col-span-8 space-y-12">
           
           {/* 关于这个博客 */}
           <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">关于这个博客</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                这个项目（MyNextBlog）不仅仅是一个博客，它是我的技术试验田。采用了最新的 <strong>Headless 架构</strong>，前后端彻底分离。
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-2">
                <li><strong>后端</strong>: 基于 .NET 10 Web API，高性能、强类型。</li>
                <li><strong>前端</strong>: 使用 Next.js 15 (App Router)，SEO 友好且交互流畅。</li>
                <li><strong>部署</strong>: 全容器化 Docker 部署，通过 Cloudflare Tunnel 穿透。</li>
              </ul>
           </section>

           {/* 猫主子介绍 */}
           <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                 <span className="text-3xl">🐾</span> 
                 猫主子介绍
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* 球球 (QiuQiu) 介绍卡片 */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-orange-100 dark:border-zinc-800 hover:shadow-md transition-all flex gap-4 items-start relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-xl"></div>
                   <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm z-10 overflow-hidden p-1">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={PETS.qiuqiu.avatar} alt={PETS.qiuqiu.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="relative z-10">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{PETS.qiuqiu.name} (QiuQiu)</h3>
                      <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 mb-2 mt-1">{PETS.qiuqiu.role}</Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {PETS.qiuqiu.description}
                      </p>
                   </div>
                </div>

                {/* 布丁 (Pudding) 介绍卡片 */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all flex gap-4 items-start relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 dark:bg-zinc-800/30 rounded-full blur-xl"></div>
                   <div className="w-16 h-16 bg-gray-900 dark:bg-black rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm z-10 overflow-hidden p-1">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={PETS.pudding.avatar} alt={PETS.pudding.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="relative z-10">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{PETS.pudding.name} (Pudding)</h3>
                      <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-600 mb-2 mt-1">{PETS.pudding.role}</Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {PETS.pudding.description}
                      </p>
                   </div>
                </div>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
}