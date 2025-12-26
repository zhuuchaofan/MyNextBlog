"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  isJson?: boolean; // 是否为 JSON 格式
}

const CONTENT_KEYS: ContentKeyConfig[] = [
  { key: "homepage_intro", label: "主页介绍", icon: Home, description: "显示在首页 Hero 区域的欢迎文字" },
  { key: "about_intro", label: "关于我介绍", icon: User, description: "显示在关于我页面的个人介绍" },
  { key: "about_author", label: "作者信息", icon: UserCircle, description: "作者基本信息（名字、头像、位置、社交链接）", isJson: true },
  { key: "about_skills", label: "技能树", icon: Wrench, description: "技能分类和熟练度", isJson: true },
  { key: "about_timeline", label: "个人经历", icon: Clock, description: "时间线形式的个人经历", isJson: true },
  { key: "about_books", label: "阅读书单", icon: BookOpen, description: "正在阅读或计划阅读的书籍", isJson: true },
  { key: "about_gears", label: "装备清单", icon: Cpu, description: "使用的硬件和软件", isJson: true },
  { key: "about_pets", label: "宠物信息", icon: Cat, description: "宠物介绍（猫主子们）", isJson: true },
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
        <div className="grid gap-6">
          {CONTENT_KEYS.map(({ key, label, icon: Icon, description, isJson }) => (
            <Card key={key} className="border-gray-100 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="w-5 h-5 text-orange-500" />
                  {label}
                  {isJson && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-normal">
                      JSON
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key}>
                      {isJson ? "JSON 内容" : "内容 (支持 HTML)"}
                    </Label>
                    {isJson && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-gray-500"
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(JSON.parse(contents[key] || "{}"), null, 2);
                            setContents({ ...contents, [key]: formatted });
                            toast.success("JSON 已格式化");
                          } catch {
                            toast.error("JSON 格式无效，无法格式化");
                          }
                        }}
                      >
                        格式化 JSON
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={key}
                    value={contents[key] || ""}
                    onChange={(e) => setContents({ ...contents, [key]: e.target.value })}
                    rows={isJson ? 12 : 6}
                    placeholder={isJson 
                      ? "输入 JSON 格式数据" 
                      : "输入内容，支持 HTML 标签如 <strong>, <br/>, <code> 等"
                    }
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Link 
                    href="/about" 
                    target="_blank"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    预览页面 →
                  </Link>
                  <Button 
                    onClick={() => {
                      // JSON 类型保存前校验
                      if (isJson && contents[key]) {
                        try {
                          JSON.parse(contents[key]);
                        } catch {
                          toast.error("JSON 格式无效，请检查后再保存");
                          return;
                        }
                      }
                      handleSave(key);
                    }} 
                    disabled={saving === key}
                  >
                    {saving === key ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="py-4">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            💡 <strong>提示</strong>：修改后需要刷新对应页面才能看到效果。如果使用了缓存，可能需要等待几分钟或清除浏览器缓存。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
