"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  Mail,
  Edit2,
  Eye,
  Code,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchEmailTemplates,
  updateEmailTemplate,
  type EmailTemplate,
} from "@/lib/api";

// 占位符说明的 Mock 数据（用于预览）
const MOCK_DATA: Record<string, Record<string, string>> = {
  new_comment: {
    PostTitle: "如何用 Next.js 15 构建博客",
    Content: "写得太棒了，学到很多！",
    GuestName: "张三",
    PostId: "42",
    CommentId: "123",
    AppUrl: "https://example.com",
  },
  spam_comment: {
    PostTitle: "如何用 Next.js 15 构建博客",
    Content: "这是一条包含敏感词的评论...",
    GuestName: "可疑用户",
    AppUrl: "https://example.com",
  },
  reply_notification: {
    RecipientName: "李四",
    PostTitle: "如何用 Next.js 15 构建博客",
    Content: "感谢你的评论！我来回复一下～",
    GuestName: "博主",
    PostId: "42",
    CommentId: "456",
    AppUrl: "https://example.com",
  },
  anniversary_reminder: {
    Title: "相恋纪念日",
    Emoji: "💕",
    TargetDate: "2025年2月14日",
    StartDate: "2020年2月14日",
    DaysBefore: "7",
    DaysTotal: "1826",
  },
};

// 渲染模板（替换占位符）
function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // 编辑表单状态
  const [formData, setFormData] = useState({
    subjectTemplate: "",
    bodyTemplate: "",
    isEnabled: true,
  });

  // 预览模式：code (源码) | preview (渲染)
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");

  // 获取模板列表
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEmailTemplates();
      setTemplates(data);
    } catch {
      toast.error("获取邮件模板列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 打开编辑对话框
  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      subjectTemplate: template.subjectTemplate,
      bodyTemplate: template.bodyTemplate,
      isEnabled: template.isEnabled,
    });
    setViewMode("preview");
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      await updateEmailTemplate(editingTemplate.templateKey, formData);
      toast.success("更新成功");
      setDialogOpen(false);
      fetchList();
    } catch {
      toast.error("更新失败");
    } finally {
      setSaving(false);
    }
  };

  // 切换启用状态
  const handleToggleEnabled = async (template: EmailTemplate) => {
    try {
      await updateEmailTemplate(template.templateKey, {
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        isEnabled: !template.isEnabled,
      });
      toast.success(template.isEnabled ? "已禁用" : "已启用");
      fetchList();
    } catch {
      toast.error("操作失败");
    }
  };


  // 从 availablePlaceholders 自动生成预览 Mock 数据
  // 当硬编码的 MOCK_DATA 中没有对应模板时使用
  const generateAutoMock = (
    placeholders: string | null
  ): Record<string, string> => {
    if (!placeholders) return {};
    try {
      const parsed = JSON.parse(placeholders) as Record<string, string>;
      // 将占位符名称转换为示例值，如 "文章标题" -> "【文章标题示例】"
      return Object.fromEntries(
        Object.entries(parsed).map(([key, desc]) => [key, `【${desc}示例】`])
      );
    } catch {
      return {};
    }
  };

  // 获取预览用的 Mock 数据
  // 优先使用手动定义的 MOCK_DATA（体验更好），fallback 到自动生成
  const getMockData = (template: EmailTemplate): Record<string, string> => {
    const manualMock = MOCK_DATA[template.templateKey];
    if (manualMock && Object.keys(manualMock).length > 0) {
      return manualMock;
    }
    // 自动生成作为 fallback，新增模板无需手动更新前端代码
    return generateAutoMock(template.availablePlaceholders);
  };

  // 解析占位符说明
  const parsePlaceholders = (
    json: string | null
  ): Record<string, string> | null => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-500" /> 邮件模板管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              自定义系统发送的邮件内容和样式
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchList} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>暂无邮件模板</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`transition-all ${!template.isEnabled ? "opacity-50" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="text-2xl">📧</span>
                    <div>
                      <span>{template.name}</span>
                    </div>
                    {!template.isEnabled && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                        已禁用
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={template.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(template)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(template)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {/* 描述文字 */}
                {template.description && (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
                {/* 主题预览 - 美化占位符 */}
                <div className="text-sm flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">主题：</span>
                  {template.subjectTemplate
                    .split(/(\{\{[^}]+\}\})/)
                    .map((part, i) =>
                      part.match(/^\{\{[^}]+\}\}$/) ? (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs"
                        >
                          {parsePlaceholders(template.availablePlaceholders)?.[
                            part.slice(2, -2)
                          ] || part.slice(2, -2)}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              编辑邮件模板：{editingTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* 邮件主题 */}
            <div className="space-y-2">
              <Label htmlFor="subject">邮件主题</Label>
              <Input
                id="subject"
                value={formData.subjectTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, subjectTemplate: e.target.value })
                }
                placeholder="使用 {{占位符}} 插入动态内容"
              />
            </div>

            {/* 可用占位符提示 */}
            {editingTemplate?.availablePlaceholders && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-2">
                  <Info className="w-4 h-4" />
                  可用占位符（点击复制）
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    parsePlaceholders(editingTemplate.availablePlaceholders) ||
                      {}
                  ).map(([key, desc]) => (
                    <button
                      key={key}
                      type="button"
                      className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      title={`点击复制 {{${key}}}`}
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${key}}}`);
                        toast.success(`已复制 {{${key}}}`);
                      }}
                    >
                      {desc || key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 视图切换 */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="w-4 h-4 mr-1" /> 预览
              </Button>
              <Button
                variant={viewMode === "code" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("code")}
              >
                <Code className="w-4 h-4 mr-1" /> 源码
              </Button>
            </div>

            {/* 邮件正文编辑/预览 */}
            <div className="border rounded-lg overflow-hidden">
              {viewMode === "code" ? (
                <textarea
                  className="w-full h-80 p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 resize-none focus:outline-none"
                  value={formData.bodyTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, bodyTemplate: e.target.value })
                  }
                  spellCheck={false}
                />
              ) : editingTemplate ? (
                <iframe
                  srcDoc={renderTemplate(
                    formData.bodyTemplate,
                    getMockData(editingTemplate)
                  )}
                  sandbox="allow-same-origin"
                  className="w-full h-80 bg-white"
                  title="邮件预览"
                />
              ) : null}
            </div>

            {/* 启用状态 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
              <div>
                <Label>启用此模板</Label>
                <p className="text-xs text-muted-foreground">
                  禁用后将不再发送此类邮件
                </p>
              </div>
              <Switch
                checked={formData.isEnabled}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, isEnabled: v })
                }
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
