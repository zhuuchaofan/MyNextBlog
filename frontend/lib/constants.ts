export const SITE_CONFIG = {
  name: "朱超凡的技术博客",
  author: "朱超凡",
  description: "全栈开发者 / .NET / Next.js / 赴日修行中",
  url: "https://zhuchaofan.online",
  avatar: "https://picture.zhuchaofan.online/CAT/boy_01.png",
  social: {
    github: "https://github.com/zhuuchaofan",
    twitter: "https://twitter.com/zhuchaofan",
    email: "zhuuchaofan@gmail.com"
  }
};

export const PETS = {
  qiuqiu: {
    name: "球球",
    role: "CTO / 首席监工",
    avatar: "https://picture.zhuchaofan.online/CAT/cat07_moyou_kijitora.png",
    description: "高冷狸花猫。代码审查极其严格，只要饭盆空了就会抛出 NullFoodException。"
  },
  pudding: {
    name: "布丁",
    role: "HR / 气氛组",
    avatar: "https://picture.zhuchaofan.online/CAT/cat01_moyou_black.png",
    description: "粘人黑猫。负责在深夜提供呼噜声白噪音，偶尔帮忙按压 Enter 键发布未完成的代码。"
  }
};

export const SKILL_CATEGORIES = [
  {
    title: "后端与数据库",
    skills: [
      { name: ".NET Framework / Core", icon: "Server", level: "精通" },
      { name: "C#", icon: "Code2", level: "精通" },
      { name: "Oracle DB", icon: "Database", level: "熟练" },
      { name: "PostgreSQL", icon: "Database", level: "熟练" },
      { name: "Legacy Migration", icon: "GitGraph", level: "熟练" }, 
      { name: "Mainframe (Learning)", icon: "Server", level: "初学" }
    ]
  },
  {
    title: "前端 (业余)",
    skills: [
      { name: "React", icon: "Layout", level: "掌握" },
      { name: "Next.js 15", icon: "Globe", level: "掌握" },
      { name: "TypeScript", icon: "Code2", level: "掌握" },
      { name: "Tailwind CSS", icon: "Palette", level: "掌握" }
    ]
  },
  {
    title: "运维与工具",
    skills: [
      { name: "Docker", icon: "Container", level: "掌握" },
      { name: "Linux", icon: "Terminal", level: "掌握" },
      { name: "Git", icon: "GitGraph", level: "熟练" },
      { name: "iTerm", icon: "Terminal", level: "熟练" }
    ]
  }
];

export interface Book {
  title: string;
  status: string;
  cover: string;
}

export const BOOKS: Book[] = [
  { title: "重构：改善既有代码的设计", status: "Reading", cover: "🔨" },
  { title: "图解HTTP", status: "Reading", cover: "🌐" },
  { title: "算法图解", status: "Reading", cover: "💡" },
];

export const TIMELINE = [
  { year: "2026 (预计)", title: "回国发展", description: "计划结束出向任务回国，继续在技术领域深耕。" },
  { year: "2025.02", title: "赴日出向", description: "来到日本富士通总部，投身大型机系统迁移项目，同时开启日语学习之旅。" },
  { year: "2019", title: "入职富士通 (西安)", description: "正式步入职场。主要负责 .NET 版本升级与数据库移行 (Oracle -> PostgreSQL) 项目，积累了扎实的企业级开发经验。" },
];

export const GEARS = [
  { category: "Hardware", items: ["Mac mini M4"] },
  { category: "Software", items: ["JetBrains Rider", "VS Code", "iTerm", "Docker Desktop", "Obsidian"] }
];