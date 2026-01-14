// 数字分身配置页面 (Digital Presence Settings)
// ==============================================================================
// 此页面允许管理员配置 Steam API Key 和其他状态检测参数。

"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Gamepad2,
  Code,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Zap,
  Coffee,
  Sparkles,
  RotateCcw,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageContainer } from '@/components/common';

// 配置项定义
interface PresenceConfig {
  steamKey: string;
  steamId: string;
  wakatimeKey: string;
}

// 当前状态类型
interface CurrentStatus {
  status: string;
  icon: string;
  message: string;
  details?: string;
  timestamp: string;
}

export default function PresenceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // 独立编辑状态
  const [editingSteamKey, setEditingSteamKey] = useState(false);
  const [editingSteamId, setEditingSteamId] = useState(false);
  const [editingWakatimeKey, setEditingWakatimeKey] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  // 手动覆盖状态
  const [overrideStatus, setOverrideStatus] = useState("custom");
  const [overrideMessage, setOverrideMessage] = useState("");
  const [overrideExpire, setOverrideExpire] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  // 表单数据
  const [config, setConfig] = useState<PresenceConfig>({
    steamKey: "",
    steamId: "",
    wakatimeKey: "",
  });

  // 加载配置
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const keys = ["config_steam_key", "config_steam_id", "config_wakatime_key"];
      const responses = await Promise.all(
        keys.map((key) =>
          fetch(`/api/backend/site-content/${key}`).then((r) =>
            r.ok ? r.json() : null
          )
        )
      );

      setConfig({
        steamKey: responses[0]?.data?.value || "",
        steamId: responses[1]?.data?.value || "",
        wakatimeKey: responses[2]?.data?.value || "",
      });
    } catch {
      toast.error("加载配置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取当前状态
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/backend/presence");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCurrentStatus(json.data);
        }
      }
    } catch {
      // 忽略错误
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, [fetchConfig, fetchStatus]);

  // 设置手动覆盖
  const handleSetOverride = async () => {
    if (!overrideMessage.trim()) return;
    setOverrideLoading(true);
    try {
      const res = await fetch("/api/backend/presence/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: overrideStatus,
          message: overrideMessage,
          expireAt: overrideExpire ? new Date(overrideExpire).toISOString() : null,
        }),
      });
      if (res.ok) {
        toast.success("状态已覆盖");
        setOverrideMessage("");
        setOverrideExpire("");
        setTimeout(fetchStatus, 1000);
      } else {
        toast.error("设置失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setOverrideLoading(false);
    }
  };

  // 清除覆盖
  const handleClearOverride = async () => {
    setOverrideLoading(true);
    try {
      const res = await fetch("/api/backend/presence/override", {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("已恢复自动检测");
        setTimeout(fetchStatus, 1000);
      } else {
        toast.error("清除失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setOverrideLoading(false);
    }
  };

  // 保存单个配置项
  const handleSaveField = async (field: 'steamKey' | 'steamId' | 'wakatimeKey') => {
    const fieldMap = {
      steamKey: { key: 'config_steam_key', value: config.steamKey, desc: 'Steam Web API Key', setEditing: setEditingSteamKey },
      steamId: { key: 'config_steam_id', value: config.steamId, desc: 'Steam 用户 ID', setEditing: setEditingSteamId },
      wakatimeKey: { key: 'config_wakatime_key', value: config.wakatimeKey, desc: 'WakaTime API Key', setEditing: setEditingWakatimeKey },
    };
    
    const item = fieldMap[field];
    setSavingField(field);
    
    try {
      const res = await fetch(`/api/backend/site-content/${item.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: item.value, description: item.desc }),
      });
      
      if (res.ok) {
        toast.success('配置已保存');
        item.setEditing(false);
        setTimeout(fetchStatus, 1000);
      } else {
        toast.error('保存失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setSavingField(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageContainer variant="admin" maxWidth="2xl">
      {/* 头部 - 响应式布局 */}
      <AdminPageHeader
        title="数字分身配置"
        icon={<Gamepad2 className="w-5 h-5 text-purple-500" />}
        description="配置站长状态检测服务 (Steam / WakaTime)"
      />

      {/* 当前状态卡片 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">当前状态</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              disabled={statusLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {currentStatus ? (
              <div className="flex items-center gap-4">
                <StatusBadge 
                  status={currentStatus.status} 
                  icon={currentStatus.icon} 
                  showPulse={currentStatus.status !== "offline"}
                  className="w-12 h-12"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{currentStatus.message}</p>
                    {currentStatus.details && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {currentStatus.details}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    状态: <span className="font-mono">{currentStatus.status}</span> | 
                    更新于: {new Date(currentStatus.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">无法获取状态，请确保后台服务正在运行。</p>
            )}

            {/* Debug 面板 */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-xs h-7 text-muted-foreground">
                  查看原始数据 (Debug)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono">{currentStatus && JSON.stringify({
                    ...currentStatus,
                    timestamp: new Date(currentStatus.timestamp).toLocaleString('zh-CN')
                  }, null, 2)}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* 手动覆盖卡片 */}
      <Card className="mb-6 border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            手动设置状态
          </CardTitle>
          <CardDescription>
            临时覆盖自动检测结果，优先级最高
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态选择 */}
          <div className="space-y-2">
            <Label>状态类型</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "coding", label: "编程中", icon: Code, color: "text-blue-500" },
                { value: "gaming", label: "游戏中", icon: Gamepad2, color: "text-purple-500" },
                { value: "busy", label: "忙碌中", icon: Coffee, color: "text-orange-500" },
                { value: "custom", label: "自定义", icon: Sparkles, color: "text-yellow-500" },
              ].map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={overrideStatus === item.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOverrideStatus(item.value)}
                  className="gap-1.5"
                >
                  <item.icon className={`w-4 h-4 ${overrideStatus === item.value ? "" : item.color}`} />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 自定义消息 */}
          <div className="space-y-2">
            <Label htmlFor="overrideMessage">显示消息</Label>
            <Input
              id="overrideMessage"
              value={overrideMessage}
              onChange={(e) => setOverrideMessage(e.target.value)}
              placeholder="如：正在开会、外出中..."
              maxLength={50}
            />
          </div>

          {/* 过期时间 */}
          <div className="space-y-2">
            <Label htmlFor="overrideExpire">自动恢复时间 (可选)</Label>
            <Input
              id="overrideExpire"
              type="datetime-local"
              value={overrideExpire}
              onChange={(e) => setOverrideExpire(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              留空则需手动清除覆盖
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSetOverride} 
              disabled={overrideLoading || !overrideMessage.trim()}
              className="flex-1"
            >
              {overrideLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              设置覆盖
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearOverride}
              disabled={overrideLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              恢复自动
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steam 配置 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              Steam 配置
            </CardTitle>
          </div>
          <CardDescription>
            监测 Steam 游戏状态，显示正在游玩的游戏
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steam API Key */}
          <div className="space-y-2">
            <Label htmlFor="steamKey">Steam Web API Key</Label>
            <div className="flex gap-2">
              <Input
                id="steamKey"
                type={showKeys ? "text" : "password"}
                value={config.steamKey}
                onChange={(e) =>
                  setConfig({ ...config, steamKey: e.target.value })
                }
                placeholder="输入你的 Steam API Key"
                disabled={!!config.steamKey && !editingSteamKey}
                className={config.steamKey && !editingSteamKey ? "bg-muted" : ""}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeys(!showKeys)}
              >
                {showKeys ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              {/* 编辑/完成按钮 */}
              {config.steamKey && !editingSteamKey ? (
                <Button variant="outline" size="icon" onClick={() => setEditingSteamKey(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : editingSteamKey ? (
                <Button 
                  size="icon" 
                  onClick={() => handleSaveField('steamKey')}
                  disabled={savingField === 'steamKey'}
                >
                  {savingField === 'steamKey' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              ) : null}
            </div>
            <a
              href="https://steamcommunity.com/dev/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              获取 Steam API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Steam ID */}
          <div className="space-y-2">
            <Label htmlFor="steamId">Steam ID</Label>
            <div className="flex gap-2">
              <Input
                id="steamId"
                value={config.steamId}
                onChange={(e) =>
                  setConfig({ ...config, steamId: e.target.value })
                }
                placeholder="如 76561198xxxxx"
                disabled={!!config.steamId && !editingSteamId}
                className={config.steamId && !editingSteamId ? "bg-muted" : ""}
              />
              {/* 编辑/完成按钮 */}
              {config.steamId && !editingSteamId ? (
                <Button variant="outline" size="icon" onClick={() => setEditingSteamId(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : editingSteamId ? (
                <Button 
                  size="icon" 
                  onClick={() => handleSaveField('steamId')}
                  disabled={savingField === 'steamId'}
                >
                  {savingField === 'steamId' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              在 Steam 个人资料 URL 中找到 (steamcommunity.com/profiles/
              <strong>76561198xxxxx</strong>)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WakaTime 配置 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              WakaTime 配置
            </CardTitle>
          </div>
          <CardDescription>
            监测 IDE 编程活动，显示编程状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="wakatimeKey">WakaTime API Key</Label>
            <div className="flex gap-2">
              <Input
                id="wakatimeKey"
                type={showKeys ? "text" : "password"}
                value={config.wakatimeKey}
                onChange={(e) =>
                  setConfig({ ...config, wakatimeKey: e.target.value })
                }
                placeholder="输入你的 WakaTime API Key"
                disabled={!!config.wakatimeKey && !editingWakatimeKey}
                className={config.wakatimeKey && !editingWakatimeKey ? "bg-muted" : ""}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeys(!showKeys)}
              >
                {showKeys ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              {/* 编辑/完成按钮 */}
              {config.wakatimeKey && !editingWakatimeKey ? (
                <Button variant="outline" size="icon" onClick={() => setEditingWakatimeKey(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : editingWakatimeKey ? (
                <Button 
                  size="icon" 
                  onClick={() => handleSaveField('wakatimeKey')}
                  disabled={savingField === 'wakatimeKey'}
                >
                  {savingField === 'wakatimeKey' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              ) : null}
            </div>
            <a
              href="https://wakatime.com/settings/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              获取 WakaTime API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
