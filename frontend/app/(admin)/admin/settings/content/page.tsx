"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, RefreshCw, Home, User, ChevronLeft, Wrench, Clock, BookOpen, Cpu, Cat, UserCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// 表单组件
import AuthorForm from "./_components/AuthorForm";
import BooksForm from "./_components/BooksForm";
import GearsForm from "./_components/GearsForm";
import PetsForm from "./_components/PetsForm";
import TimelineForm from "./_components/TimelineForm";
import SkillsForm from "./_components/SkillsForm";

// 表单组件映射
const FORM_COMPONENTS: Record<string, React.ComponentType<{ value: string; onChange: (json: string) => void }>> = {
  about_author: AuthorForm,
  about_books: BooksForm,
  about_gears: GearsForm,
  about_pets: PetsForm,
  about_timeline: TimelineForm,
  about_skills: SkillsForm,
};

interface SiteContent {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

interface ContentKeyConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isJson?: boolean;
  previewUrl?: string; // 预览链接
}


// 基础内容配置
const BASIC_CONTENT_KEYS: ContentKeyConfig[] = [
  { key: "homepage_intro", label: "主页介绍", icon: Home, description: "显示在首页 Hero 区域的欢迎文字", previewUrl: "/" },
  { key: "about_intro", label: "关于我介绍", icon: User, description: "显示在关于我页面的个人介绍", previewUrl: "/about" },
  { key: "site_launch_date", label: "网站起始日期", icon: Clock, description: "网站上线日期（格式：2024-12-01），用于计算运行天数", previewUrl: "/" },
];

// 首页 Hero 配置
const HOMEPAGE_HERO_KEYS: ContentKeyConfig[] = [
  { key: "homepage_slogan", label: "首页 Slogan", icon: Home, description: "顶部标签文案（如：探索 • 记录 • 分享）", previewUrl: "/" },
  { key: "homepage_title_suffix", label: "标题后缀", icon: Home, description: "主标题后缀（如：技术后花园）", previewUrl: "/" },
  { key: "homepage_cta_primary", label: "主按钮文案", icon: Home, description: "首页主按钮文案（如：开始阅读）", previewUrl: "/" },
  { key: "homepage_cta_secondary", label: "次要按钮文案", icon: Home, description: "首页次要按钮文案（如：认识博主）", previewUrl: "/" },
];

// 系统监控组件配置
const STATS_WIDGET_KEYS: ContentKeyConfig[] = [
  { key: "stats_system_status", label: "系统状态", icon: Cpu, description: "系统监控状态文案（如：系统运转正常）", previewUrl: "/" },
  { key: "stats_total_visits", label: "访问量标签", icon: Cpu, description: "累计访问量标签文案", previewUrl: "/" },
  { key: "stats_server_time", label: "时间标签", icon: Clock, description: "服务器时间标签文案", previewUrl: "/" }
];

// 关于页面详细配置
const ABOUT_PAGE_KEYS: ContentKeyConfig[] = [
  { key: "about_author", label: "作者信息", icon: UserCircle, description: "名字、头像、位置、社交链接", isJson: true, previewUrl: "/about" },
  { key: "about_skills", label: "技能树", icon: Wrench, description: "技能分类和熟练度", isJson: true, previewUrl: "/about" },
  { key: "about_timeline", label: "个人经历", icon: Clock, description: "时间线形式的个人经历", isJson: true, previewUrl: "/about" },
  { key: "about_books", label: "阅读书单", icon: BookOpen, description: "正在阅读或计划阅读的书籍", isJson: true, previewUrl: "/about" },
  { key: "about_gears", label: "装备清单", icon: Cpu, description: "使用的硬件和软件", isJson: true, previewUrl: "/about" },
  { key: "about_pets", label: "宠物信息", icon: Cat, description: "宠物介绍", isJson: true, previewUrl: "/about" },
  { key: "about_thanks_title", label: "致谢标题", icon: User, description: "特别致谢部分的标题（如：致我的女朋友）", previewUrl: "/about" },
  { key: "about_thanks_content", label: "致谢内容", icon: User, description: "特别致谢部分的正文内容", previewUrl: "/about" },
];

// 配置组定义
const CONTENT_GROUPS = [
  { title: "基础内容", description: "主页和关于页面的介绍文字", items: BASIC_CONTENT_KEYS },
  { title: "首页 Hero 配置", description: "首页顶部区域的文案和按钮", items: HOMEPAGE_HERO_KEYS },
  { title: "系统监控组件", description: "Dashboard 小组件的标签文案", items: STATS_WIDGET_KEYS },
  { title: "关于页面配置", description: "技能、经历、书单等详细信息 (JSON 格式)", items: ABOUT_PAGE_KEYS },
];

export default function ContentSettingsPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // 获取所有内容
  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backend/site-content", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const contentMap: Record<string, string> = {};
          json.data.forEach((item: SiteContent) => {
            contentMap[item.key] = item.value;
          });
          setContents(contentMap);
        }
      }
    } catch (error) {
      console.error("Failed to fetch contents:", error);
      toast.error("获取内容失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // 保存单个内容
  const handleSave = async (key: string, isJson?: boolean) => {
    let valueToSave = contents[key] || "";
    
    // JSON 类型自动格式化
    if (isJson && valueToSave) {
      try {
        const parsed = JSON.parse(valueToSave);
        valueToSave = JSON.stringify(parsed, null, 2);
        // 同时更新本地状态
        setContents(prev => ({ ...prev, [key]: valueToSave }));
      } catch {
        toast.error("JSON 格式无效，请检查后再保存");
        return;
      }
    }
    
    setSaving(key);
    try {
      const res = await fetch(`/api/backend/site-content/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: valueToSave }),
      });

      if (res.ok) {
        toast.success("保存成功！");
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("保存失败");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden">
      {/* 头部导航 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">内容配置</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              管理主页和关于我页面的介绍文字
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchContents} disabled={loading} className="border-gray-200 dark:border-zinc-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 内容编辑卡片 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-10">
          {CONTENT_GROUPS.map((group) => (
            <section key={group.title}>
              {/* 分组标题 */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
              </div>
              
              {/* 配置项列表 - JSON 类型使用两列 */}
              <div className={`grid gap-4 ${group.items[0]?.isJson ? "md:grid-cols-2" : ""}`}>
                {group.items.map(({ key, label, icon: Icon, description, isJson, previewUrl }) => (
                  <Card key={key} className="border-gray-100 dark:border-zinc-800 h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="w-4 h-4 text-orange-500" />
                        {label}
                        {isJson && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                            JSON
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 flex-grow flex flex-col">
                      {/* 根据类型渲染不同的编辑器 */}
                      {isJson && FORM_COMPONENTS[key] ? (
                        // 使用表单组件
                        (() => {
                          const FormComponent = FORM_COMPONENTS[key];
                          return (
                            <FormComponent
                              value={contents[key] || ""}
                              onChange={(json) => setContents({ ...contents, [key]: json })}
                            />
                          );
                        })()
                      ) : (
                        // 普通文本使用 Textarea
                        <Textarea
                          id={key}
                          value={contents[key] || ""}
                          onChange={(e) => setContents({ ...contents, [key]: e.target.value })}
                          rows={3}
                          placeholder="输入内容，支持 HTML 标签"
                          className="font-mono text-sm resize-y flex-grow w-full min-h-[80px]"
                        />
                      )}
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center justify-between pt-1">
                        <Link 
                          href={previewUrl || "/about"} 
                          target="_blank"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          预览 →
                        </Link>
                        <Button 
                          size="sm"
                          onClick={() => handleSave(key, isJson)} 
                          disabled={saving === key}
                        >
                          {saving === key ? (
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3 mr-1.5" />
                          )}
                          保存
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <Card className="mt-8 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="py-3">
          <p className="text-xs text-orange-800 dark:text-orange-200">
            💡 修改后需刷新对应页面查看效果。ISR 缓存可能导致最多 60 秒延迟。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
