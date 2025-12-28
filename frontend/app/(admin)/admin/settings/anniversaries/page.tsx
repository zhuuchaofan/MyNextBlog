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
  Calendar, Repeat, PartyPopper, Mail
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
import { SwipeableItem } from "@/components/ui/swipeable-item";

// 重复类型选项
const REPEAT_TYPES = [
  { value: "yearly", label: "每年", icon: "🎂" },
  { value: "monthly", label: "每月", icon: "🌙" },
  { value: "once", label: "仅一次", icon: "🎯" },
];

// 显示类型选项
const DISPLAY_TYPES = [
  { value: "duration", label: "时长", desc: "如：5年7个月" },
  { value: "age", label: "年龄", desc: "如：31岁" },
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
    displayType: "duration",
    isActive: true,
    displayOrder: 0,
    // 邮件提醒
    enableReminder: false,
    reminderEmail: "",
    reminderDays: "7,1,0",
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
      displayType: "duration",
      isActive: true,
      displayOrder: 0,
      enableReminder: false,
      reminderEmail: "",
      reminderDays: "7,1,0",
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
      displayType: ann.displayType,
      isActive: ann.isActive,
      displayOrder: ann.displayOrder,
      enableReminder: ann.enableReminder,
      reminderEmail: ann.reminderEmail || "",
      reminderDays: ann.reminderDays,
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
        title: ann.title,
        emoji: ann.emoji,
        startDate: ann.startDate,
        repeatType: ann.repeatType,
        displayType: ann.displayType,
        isActive: !ann.isActive,
        displayOrder: ann.displayOrder,
        enableReminder: ann.enableReminder,
        reminderEmail: ann.reminderEmail || undefined,
        reminderDays: ann.reminderDays,
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
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-pink-500" />
                  {editingId ? "编辑纪念日" : "添加纪念日"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
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

                {/* 标题和日期 - 两列布局 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">纪念日名称</Label>
                    <Input
                      id="title"
                      placeholder="如：相恋纪念日"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">起始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* 重复类型和显示格式 - 两列布局 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <Label>显示格式</Label>
                    <Select
                      value={formData.displayType}
                      onValueChange={(v) => setFormData({ ...formData, displayType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISPLAY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} <span className="text-xs text-muted-foreground">({type.desc})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 邮件提醒配置 */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">开启邮件提醒</Label>
                    </div>
                    <Switch
                      checked={formData.enableReminder}
                      onCheckedChange={(v) => setFormData({ ...formData, enableReminder: v })}
                    />
                  </div>
                  
                  {formData.enableReminder && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-1">
                        <Label htmlFor="reminderEmail" className="text-sm">提醒邮箱</Label>
                        <Input
                          id="reminderEmail"
                          type="email"
                          placeholder="example@gmail.com"
                          className="h-9"
                          value={formData.reminderEmail}
                          onChange={(e) => setFormData({ ...formData, reminderEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">提醒时间</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[30, 15, 7, 1, 0].map((day) => {
                            const days = formData.reminderDays.split(',').map(d => parseInt(d.trim()));
                            const isSelected = days.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? days.filter(d => d !== day)
                                    : [...days, day].sort((a, b) => b - a);
                                  setFormData({ ...formData, reminderDays: newDays.join(',') });
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                                  isSelected
                                    ? 'bg-pink-500 text-white border-pink-500'
                                    : 'bg-background border-input hover:border-pink-300'
                                }`}
                              >
                                {day === 0 ? '当天' : `${day}天前`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={saving}>
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
            <SwipeableItem
              key={ann.id}
              onEdit={() => handleOpenEdit(ann)}
              onDelete={() => handleDelete(ann.id)}
              className="rounded-xl"
            >
              <Card
                className={`transition-all border-none shadow-none rounded-none sm:border sm:shadow-sm sm:rounded-xl ${!ann.isActive ? "opacity-50" : ""}`}
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
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={ann.isActive}
                          onCheckedChange={() => handleToggleActive(ann)}
                        />
                      </div>
                      {/* Desktop Buttons */}
                      <div className="hidden sm:flex items-center gap-1">
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
                      {/* Mobile Hint */}
                      <div className="sm:hidden text-xs text-muted-foreground opacity-50">
                        <ChevronLeft className="w-4 h-4 inline" />
                      </div>
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
                    已经 {formatDaysSmart(ann.daysSinceStart, ann.displayType)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </SwipeableItem>
          ))}
        </div>
      )}
    </div>
  );
}
