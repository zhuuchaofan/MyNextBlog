import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Github, Mail, Twitter, 
  Code2, Database, Layout, Server, Terminal, Cpu, Globe, Palette, Cloud, Container, GitGraph,
  BookOpen, Wrench, Briefcase, MapPin, Calendar
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

// 状态颜色映射
const statusColors: Record<string, string> = {
  Reading: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Plan: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200 dark:border-zinc-700",
  Finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
};

// 技能等级颜色映射
const skillLevelColors: Record<string, string> = {
  "精通": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200",
  "熟练": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200",
  "掌握": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200",
  "初学": "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200",
};

// 获取站点配置内容 (Server-Side)
async function getSiteContent(key: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:5095';
  try {
    const res = await fetch(`${backendUrl}/api/site-content/${key}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data.value : null;
  } catch {
    return null;
  }
}

// 解析 JSON 配置，失败时返回默认值
function parseJsonConfig<T>(jsonStr: string | null, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return defaultValue;
  }
}

// 定义类型
interface AuthorConfig {
  name: string;
  avatar: string;
  location: string;
  description: string;
  social: { github: string; twitter: string; email: string };
}

interface SkillCategory {
  title: string;
  skills: { name: string; icon: string; level: string }[];
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface BookItem {
  title: string;
  status: string;
  cover: string;
}

interface GearCategory {
  category: string;
  items: string[];
}

interface PetInfo {
  name: string;
  role: string;
  avatar: string;
  description: string;
}

// 获取关于页面所有配置数据
async function getAboutPageData() {
  // 获取所有配置内容
  const [introContent, authorJson, skillsJson, timelineJson, booksJson, gearsJson, petsJson, thanksTitle, thanksContent] = await Promise.all([
    getSiteContent('about_intro'),
    getSiteContent('about_author'),
    getSiteContent('about_skills'),
    getSiteContent('about_timeline'),
    getSiteContent('about_books'),
    getSiteContent('about_gears'),
    getSiteContent('about_pets'),
    getSiteContent('about_thanks_title'),
    getSiteContent('about_thanks_content')
  ]);

  // 使用 constants.ts 中的值作为默认回退
  const author = parseJsonConfig<AuthorConfig>(authorJson, {
    name: SITE_CONFIG.author,
    avatar: SITE_CONFIG.avatar,
    location: "日本·东京 (出向中)",
    description: SITE_CONFIG.description,
    social: SITE_CONFIG.social,
  });

  return {
    aboutIntro: introContent || `${SITE_CONFIG.description}。欢迎一起交流！`,
    author,
    skills: parseJsonConfig<SkillCategory[]>(skillsJson, SKILL_CATEGORIES),
    timeline: parseJsonConfig<TimelineItem[]>(timelineJson, TIMELINE),
    books: parseJsonConfig<BookItem[]>(booksJson, BOOKS),
    gears: parseJsonConfig<GearCategory[]>(gearsJson, GEARS),
    pets: parseJsonConfig<PetInfo[]>(petsJson, Object.values(PETS)),
    thanksTitle: thanksTitle || "致我的女朋友",
    thanksContent: thanksContent || "感谢你在中国对我全方位的支持与陪伴。即使相隔千里，你的鼓励与理解始终是我前行的动力。这个博客的每一行代码、每一篇文章，都承载着你的温暖与祝福。❤️"
  };
}

export default async function AboutPage() {
  const { aboutIntro, author, skills, timeline, books, gears, pets, thanksTitle, thanksContent } = await getAboutPageData();
  return (
    <div className="relative min-h-screen">
      {/* 背景装饰：已移至全局 Layout */}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 space-y-16 relative z-10">
        
        {/* 1. Hero 区域 */}
        <section className="flex flex-col md:flex-row items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative group flex-shrink-0">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
             <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-white dark:border-zinc-900 shadow-2xl overflow-hidden bg-white">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={author.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
             </div>
             <div className="absolute bottom-2 right-2 bg-white dark:bg-zinc-800 p-2.5 rounded-full shadow-lg text-2xl border border-gray-100 dark:border-zinc-700 animate-bounce delay-1000 duration-3000">
               👨‍💻
             </div>
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-5">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
                你好，我是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">{author.name}</span>
                <span className="ml-3 text-3xl inline-block animate-wave origin-[70%_70%]">👋</span>
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium flex flex-wrap justify-center md:justify-start gap-2 items-center">
                <MapPin className="w-5 h-5" /> {author.location}
              </p>
            </div>
            
            <p 
              className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: aboutIntro }}
            />
  
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <Button className="rounded-full gap-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm" asChild>
                <Link href={author.social.github} target="_blank">
                   <Github className="w-4 h-4" /> Github
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800" asChild>
                <Link href={author.social.twitter} target="_blank">
                  <Twitter className="w-4 h-4 text-blue-400" /> Twitter
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800" asChild>
                <Link href={`mailto:${author.social.email}`}>
                  <Mail className="w-4 h-4 text-orange-500" /> Email
                </Link>
              </Button>
            </div>
          </div>
        </section>
  
        {/* 2. 技能树 - Bento Grid 风格 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Wrench className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">技能树</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {skills.map((category, index) => (
              <Card key={category.title} className="border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-gray-50 dark:border-zinc-800/50">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {index === 0 && <Server className="w-4 h-4 text-blue-500" />}
                    {index === 1 && <Layout className="w-4 h-4 text-pink-500" />}
                    {index === 2 && <Terminal className="w-4 h-4 text-green-500" />}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid gap-3">
                  {category.skills.map((skill) => (
                    <div key={skill.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 dark:text-gray-500 w-5 flex justify-center">{iconMap[skill.icon]}</span>
                        <span>{skill.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal border ${skillLevelColors[skill.level] || "bg-gray-50 border-gray-200"}`}>
                        {skill.level}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
  
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* 左列：装备 + 书单 (4/12) */}
          <div className="md:col-span-4 space-y-8">
             
             {/* 装备 */}
             <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm h-fit">
               <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-500" /> 装备
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-5">
                  {gears.map(g => (
                    <div key={g.category}>
                      <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">{g.category}</h4>
                      <ul className="space-y-2">
                        {g.items.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
               </CardContent>
             </Card>
  
             {/* 书单 */}
             <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm h-fit">
                <CardHeader className="pb-3">
                   <CardTitle className="text-lg flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-blue-500" /> 在读 / 想读
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   {books.length > 0 ? (
                     books.map((book) => (
                       <div key={book.title} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <div className="text-xl flex-shrink-0 mt-0.5">{book.cover}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-200 leading-snug">{book.title}</p>
                            <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded border ${statusColors[book.status]}`}>
                              {book.status}
                            </span>
                          </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm text-gray-500 italic">最近在忙着敲代码，没空看书...</p>
                   )}
                </CardContent>
             </Card>
          </div>
  
          {/* 右列：经历 + 猫 (8/12) */}
          <div className="md:col-span-8 space-y-8">
             
             {/* 经历 Timeline */}
             <Card className="border border-gray-100 dark:border-zinc-800 shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
               <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500" /> 经历
                  </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="relative border-l border-gray-200 dark:border-zinc-700 ml-8 space-y-8 pl-6 py-2">
                   {timeline.map((item, index) => (
                     <div key={index} className="relative group">
                       <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${index === 0 ? "bg-orange-500" : "bg-gray-300 dark:bg-zinc-600"} group-hover:scale-110 transition-transform`}></span>
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                         <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">{item.title}</h3>
                         <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md self-start sm:self-auto">
                            <Calendar className="w-3 h-3 inline mr-1 mb-0.5" />
                            {item.year}
                         </span>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         {item.description}
                       </p>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
                          {/* 特别致谢（可配置） */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                   <span className="text-2xl">💝</span> 
                   <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">特别致谢</h2>
                </div>
                <Card className="border-pink-100 dark:border-pink-900/30 bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-950/10 dark:to-zinc-900/50 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-transparent dark:from-pink-500/10 rounded-bl-full"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-2xl">❤️</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {thanksTitle}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {thanksContent}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
             </section>

             {/* 猫主子 */}
             <section>
                <div className="flex items-center gap-3 mb-4 px-1">
                   <span className="text-2xl">🐾</span> 
                   <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">猫主子</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pets.map((pet) => (
                    <Card key={pet.name} className="overflow-hidden border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-orange-200 dark:hover:border-orange-900 transition-colors group">
                       <CardContent className="p-4 flex gap-4 items-start relative">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/10 rounded-bl-full opacity-50"></div>
                         <div className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm overflow-hidden flex-shrink-0 bg-gray-100">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                         </div>
                         <div className="relative z-10">
                            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {pet.name}
                            </h3>
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1.5">{pet.role}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {pet.description}
                            </p>
                         </div>
                       </CardContent>
                    </Card>
                  ))}
                </div>
             </section>
  
          </div>
        </div>
      </div>
    </div>
  );
}