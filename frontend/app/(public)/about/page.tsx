import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Github, Mail, Twitter, 
  Code2, Database, Layout, Server, Terminal, Cpu, Globe, Palette, Cloud, Container, GitGraph
} from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG, PETS, SKILL_CATEGORIES, BOOKS, TIMELINE, GEARS } from "@/lib/constants"; 

// 扩展图标映射
const iconMap: Record<string, React.ReactNode> = {
  Server: <Server className="w-5 h-5" />,
  Layout: <Layout className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  Terminal: <Terminal className="w-5 h-5" />,
  Code2: <Code2 className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  Cloud: <Cloud className="w-5 h-5" />,
  Container: <Container className="w-5 h-5" />,
  GitGraph: <GitGraph className="w-5 h-5" />,
};

const statusColors: Record<string, string> = {
  Reading: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Plan: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400",
  Finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 space-y-20">
      
      {/* 1. 头部区域：个人简介 */}
      <section className="flex flex-col md:flex-row items-center gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
           <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl overflow-hidden bg-white">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={SITE_CONFIG.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
           </div>
           <div className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 p-3 rounded-full shadow-lg text-2xl border border-gray-100 dark:border-zinc-700">
             👨‍💻
           </div>
        </div>
        
        <div className="text-center md:text-left flex-1 space-y-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-2">
              你好，我是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">{SITE_CONFIG.author}</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
              {SITE_CONFIG.description}
            </p>
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            热衷于构建高性能 Web 应用，目前专注于 
            <code className="mx-1.5 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-base border border-blue-100 dark:border-blue-800">.NET</code> 
            与 
            <code className="mx-1.5 px-2 py-0.5 rounded bg-black dark:bg-zinc-100 text-white dark:text-black font-mono text-base border border-gray-800">Next.js</code> 
            生态。喜欢折腾新技术，追求极致的用户体验和代码质量。
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            <Button className="rounded-full pl-4 pr-6 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all" asChild>
              <Link href={SITE_CONFIG.social.github} target="_blank">
                 <Github className="w-5 h-5 mr-2" /> Github
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full pl-4 pr-6 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" asChild>
              <Link href={SITE_CONFIG.social.twitter} target="_blank">
                <Twitter className="w-5 h-5 mr-2" /> Twitter
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full pl-4 pr-6 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800" asChild>
              <Link href={`mailto:${SITE_CONFIG.social.email}`}>
                <Mail className="w-5 h-5 mr-2" /> 联系我
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 技能树区域 */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1.5 bg-orange-500 rounded-full"></div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">技能树</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SKILL_CATEGORIES.map((category) => (
            <Card key={category.title} className="border-0 shadow-sm bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  {category.title.includes("Backend") && <Server className="w-5 h-5 text-blue-500" />}
                  {category.title.includes("Frontend") && <Layout className="w-5 h-5 text-pink-500" />}
                  {category.title.includes("DevOps") && <Terminal className="w-5 h-5 text-green-500" />}
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors">
                        {iconMap[skill.icon] || <Code2 className="w-5 h-5" />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{skill.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400">
                      {skill.level}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-12 gap-12">
        {/* 左列：阅读列表 + 装备 */}
        <div className="md:col-span-4 space-y-12">
           {/* 阅读清单 */}
           <section>
             <div className="flex items-center gap-3 mb-6">
               <span className="text-2xl">📚</span>
               <h2 className="text-2xl font-bold">在读 / 想读</h2>
             </div>
             <div className="space-y-3">
               {BOOKS.map((book) => (
                 <div key={book.title} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                    <div className="text-2xl">{book.cover}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={book.title}>{book.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[book.status] || "bg-gray-100"}`}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
           </section>

           {/* 装备清单 */}
           <section>
              <div className="flex items-center gap-3 mb-6">
               <span className="text-2xl">⚡</span>
               <h2 className="text-2xl font-bold">我的装备</h2>
             </div>
             <div className="space-y-6">
                {GEARS.map(g => (
                  <div key={g.category}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{g.category}</h3>
                    <ul className="space-y-2">
                      {g.items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                          <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
             </div>
           </section>
        </div>

        {/* 右列：时间线 + 猫主子 */}
        <div className="md:col-span-8 space-y-12">
           
           {/* 时间线 */}
           <section>
             <div className="flex items-center gap-3 mb-8">
               <span className="text-2xl">🚀</span>
               <h2 className="text-2xl font-bold">经历</h2>
             </div>
             <div className="relative border-l-2 border-gray-200 dark:border-zinc-800 ml-3 space-y-10 pl-8 py-2">
               {TIMELINE.map((item, index) => (
                 <div key={index} className="relative">
                   <div className="absolute -left-[39px] top-1 w-5 h-5 bg-white dark:bg-zinc-950 border-4 border-orange-500 rounded-full"></div>
                   <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                     <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.title}</span>
                     <span className="text-sm font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">{item.year}</span>
                   </div>
                   <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                     {item.description}
                   </p>
                 </div>
               ))}
             </div>
           </section>

           {/* 猫主子介绍 */}
           <section>
              <div className="flex items-center gap-3 mb-8">
                 <span className="text-3xl">🐾</span> 
                 <h2 className="text-2xl font-bold">猫主子</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* 球球 */}
                <div className="group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-orange-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-900 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                   <div className="relative z-10 flex flex-col items-center text-center">
                     <div className="w-24 h-24 mb-4 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg overflow-hidden">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={PETS.qiuqiu.avatar} alt={PETS.qiuqiu.name} className="w-full h-full object-cover" />
                     </div>
                     <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">{PETS.qiuqiu.name}</h3>
                     <Badge variant="outline" className="mb-4 border-orange-200 text-orange-600 dark:border-orange-900 dark:text-orange-400">{PETS.qiuqiu.role}</Badge>
                     <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                       {PETS.qiuqiu.description}
                     </p>
                   </div>
                </div>

                {/* 布丁 */}
                <div className="group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-zinc-800/30 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                   <div className="relative z-10 flex flex-col items-center text-center">
                     <div className="w-24 h-24 mb-4 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg overflow-hidden bg-gray-900">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={PETS.pudding.avatar} alt={PETS.pudding.name} className="w-full h-full object-cover" />
                     </div>
                     <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">{PETS.pudding.name}</h3>
                     <Badge variant="outline" className="mb-4 border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-gray-400">{PETS.pudding.role}</Badge>
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