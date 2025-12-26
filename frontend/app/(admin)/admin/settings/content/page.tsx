"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, RefreshCw, Home, User, ChevronLeft, Wrench, Clock, BookOpen, Cpu, Cat, UserCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
];

// 关于页面详细配置
const ABOUT_PAGE_KEYS: ContentKeyConfig[] = [
  { key: "about_author", label: "作者信息", icon: UserCircle, description: "名字、头像、位置、社交链接", isJson: true, previewUrl: "/about" },
  { key: "about_skills", label: "技能树", icon: Wrench, description: "技能分类和熟练度", isJson: true, previewUrl: "/about" },
  { key: "about_timeline", label: "个人经历", icon: Clock, description: "时间线形式的个人经历", isJson: true, previewUrl: "/about" },
  { key: "about_books", label: "阅读书单", icon: BookOpen, description: "正在阅读或计划阅读的书籍", isJson: true, previewUrl: "/about" },
  { key: "about_gears", label: "装备清单", icon: Cpu, description: "使用的硬件和软件", isJson: true, previewUrl: "/about" },
  { key: "about_pets", label: "宠物信息", icon: Cat, description: "宠物介绍", isJson: true, previewUrl: "/about" },
];

// 配置组定义
const CONTENT_GROUPS = [
  { title: "基础内容", description: "主页和关于页面的介绍文字", items: BASIC_CONTENT_KEYS },
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
  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const res = await fetch(`/api/backend/site-content/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: contents[key] || "" }),
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 头部导航 - 与文章管理、评论管理一致 */}
      <div className="flex items-center justify-between mb-8">
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
                      {/* JSON 操作按钮 */}
                      {isJson && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              try {
                                const formatted = JSON.stringify(JSON.parse(contents[key] || "{}"), null, 2);
                                setContents({ ...contents, [key]: formatted });
                                toast.success("已格式化");
                              } catch {
                                toast.error("JSON 格式无效");
                              }
                            }}
                          >
                            格式化
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              try {
                                const minified = JSON.stringify(JSON.parse(contents[key] || "{}"));
                                setContents({ ...contents, [key]: minified });
                                toast.success("已压缩");
                              } catch {
                                toast.error("JSON 格式无效");
                              }
                            }}
                          >
                            压缩
                          </Button>
                        </div>
                      )}
                      
                      {/* 内容输入框 - 移动端使用更小的高度 */}
                      <Textarea
                        id={key}
                        value={contents[key] || ""}
                        onChange={(e) => setContents({ ...contents, [key]: e.target.value })}
                        rows={isJson ? 6 : 3}
                        placeholder={isJson 
                          ? "输入 JSON 格式数据" 
                          : "输入内容，支持 HTML 标签"
                        }
                        className={`font-mono text-sm resize-y flex-grow ${isJson ? "min-h-[150px] md:min-h-[200px]" : "min-h-[80px]"}`}
                      />
                      
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
                          onClick={() => {
                            if (isJson && contents[key]) {
                              try {
                                JSON.parse(contents[key]);
                              } catch {
                                toast.error("JSON 格式无效");
                                return;
                              }
                            }
                            handleSave(key);
                          }} 
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
