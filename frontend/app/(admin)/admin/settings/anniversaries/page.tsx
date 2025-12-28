"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, Plus, Loader2, RefreshCw, Heart, Trash2, Edit2, 
  Calendar, Repeat, PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllAnniversariesAdmin,
  createAnniversary,
  updateAnniversary,
  deleteAnniversary,
  type AnniversaryAdmin,
} from "@/lib/api";
import { formatDaysSmart } from "@/lib/dateUtils";

// 重复类型选项
const REPEAT_TYPES = [
  { value: "yearly", label: "每年", icon: "🎂" },
  { value: "monthly", label: "每月", icon: "🌙" },
  { value: "once", label: "仅一次", icon: "🎯" },
];

// 常用 Emoji 列表
const EMOJI_OPTIONS = ["💕", "❤️", "🎂", "🌙", "💍", "🌹", "🎉", "✨", "🏠", "👶"];

export default function AnniversariesPage() {
  const router = useRouter();
  const [anniversaries, setAnniversaries] = useState<AnniversaryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    emoji: "💕",
    startDate: "",
    repeatType: "yearly",
    isActive: true,
    displayOrder: 0,
  });

  // 获取纪念日列表
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllAnniversariesAdmin();
      setAnniversaries(data);
    } catch {
      toast.error("获取纪念日列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 打开新建对话框
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      emoji: "💕",
      startDate: new Date().toISOString().split("T")[0],
      repeatType: "yearly",
      isActive: true,
      displayOrder: 0,
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEdit = (ann: AnniversaryAdmin) => {
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      emoji: ann.emoji,
      startDate: ann.startDate,
      repeatType: ann.repeatType,
      isActive: ann.isActive,
      displayOrder: ann.displayOrder,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("请输入纪念日标题");
      return;
    }
    if (!formData.startDate) {
      toast.error("请选择日期");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAnniversary(editingId, formData);
        toast.success("更新成功");
      } else {
        await createAnniversary(formData);
        toast.success("创建成功");
      }
      setDialogOpen(false);
      fetchList();
    } catch {
      toast.error(editingId ? "更新失败" : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除纪念日
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个纪念日吗？")) return;
    
    try {
      await deleteAnniversary(id);
      toast.success("删除成功");
      fetchList();
    } catch {
      toast.error("删除失败");
    }
  };

  // 切换启用状态
  const handleToggleActive = async (ann: AnniversaryAdmin) => {
    try {
      await updateAnniversary(ann.id, {
        ...ann,
        isActive: !ann.isActive,
      });
      toast.success(ann.isActive ? "已禁用" : "已启用");
      fetchList();
    } catch {
      toast.error("操作失败");
    }
  };

  // 获取重复类型标签
  const getRepeatLabel = (type: string) => {
    const found = REPEAT_TYPES.find((t) => t.value === type);
    return found ? `${found.icon} ${found.label}` : type;
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
              <Heart className="w-6 h-6 text-pink-500" /> 纪念日管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理首页浮动挂件显示的纪念日
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchList} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" /> 添加纪念日
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-pink-500" />
                  {editingId ? "编辑纪念日" : "添加纪念日"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Emoji 选择 */}
                <div className="space-y-2">
                  <Label>选择图标</Label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        className={`text-2xl p-2 rounded-lg border transition-all ${
                          formData.emoji === emoji
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-950 scale-110"
                            : "border-gray-200 dark:border-gray-700 hover:border-pink-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">纪念日名称</Label>
                  <Input
                    id="title"
                    placeholder="如：相恋纪念日"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* 日期 */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">起始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                {/* 重复类型 */}
                <div className="space-y-2">
                  <Label>重复类型</Label>
                  <Select
                    value={formData.repeatType}
                    onValueChange={(v) => setFormData({ ...formData, repeatType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPEAT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingId ? "保存" : "创建"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : anniversaries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>还没有添加任何纪念日</p>
            <Button variant="link" onClick={handleOpenCreate} className="mt-2">
              点击添加第一个纪念日
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {anniversaries.map((ann) => (
            <Card
              key={ann.id}
              className={`transition-all ${!ann.isActive ? "opacity-50" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="text-2xl">{ann.emoji}</span>
                    <span>{ann.title}</span>
                    {!ann.isActive && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                        已禁用
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ann.isActive}
                      onCheckedChange={() => handleToggleActive(ann)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ann)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(ann.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {ann.startDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat className="w-4 h-4" />
                    {getRepeatLabel(ann.repeatType)}
                  </span>
                  <span className="text-pink-500 font-medium">
                    已经 {formatDaysSmart(ann.daysSinceStart)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
