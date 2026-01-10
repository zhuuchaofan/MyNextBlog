// 数字分身配置页面 (Digital Presence Settings)
// ==============================================================================
// 此页面允许管理员配置 Steam API Key 和其他状态检测参数。

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Loader2,
  Save,
  Gamepad2,
  Code,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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
      // 分别获取各个配置项
      const keys = ["config_steam_key", "config_steam_id", "config_wakatime_key"];
      const responses = await Promise.all(
        keys.map((key) =>
          fetch(`/api/backend/site-contents/${key}`).then((r) =>
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

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          key: "config_steam_key",
          value: config.steamKey,
          description: "Steam Web API Key",
        },
        {
          key: "config_steam_id",
          value: config.steamId,
          description: "Steam 用户 ID",
        },
        {
          key: "config_wakatime_key",
          value: config.wakatimeKey,
          description: "WakaTime API Key",
        },
      ];

      // 逐个保存
      for (const item of updates) {
        if (item.value) {
          await fetch("/api/backend/site-contents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
        }
      }

      toast.success("配置已保存");
      // 刷新状态
      setTimeout(fetchStatus, 2000);
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 状态图标颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "coding":
        return "text-blue-500";
      case "gaming":
        return "text-purple-500";
      case "listening":
        return "text-green-500";
      default:
        return "text-gray-400";
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🤖 数字分身配置
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置站长状态检测服务 (Steam / WakaTime)
          </p>
        </div>
      </div>

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
          {currentStatus ? (
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center ${getStatusColor(currentStatus.status)}`}
              >
                {currentStatus.status === "gaming" ? (
                  <Gamepad2 className="w-5 h-5" />
                ) : currentStatus.status === "coding" ? (
                  <Code className="w-5 h-5" />
                ) : (
                  <span className="text-xl">😴</span>
                )}
              </div>
              <div>
                <p className="font-medium">{currentStatus.message}</p>
                <p className="text-sm text-muted-foreground">
                  状态: {currentStatus.status} | 更新于:{" "}
                  {new Date(currentStatus.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">无法获取状态</p>
          )}
        </CardContent>
      </Card>

      {/* Steam 配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-500" />
            Steam 配置
          </CardTitle>
          <CardDescription>
            监测 Steam 游戏状态，显示正在游玩的游戏
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="steamId">Steam ID</Label>
            <Input
              id="steamId"
              value={config.steamId}
              onChange={(e) =>
                setConfig({ ...config, steamId: e.target.value })
              }
              placeholder="如 76561198xxxxx"
            />
            <p className="text-xs text-muted-foreground">
              在 Steam 个人资料 URL 中找到 (steamcommunity.com/profiles/
              <strong>76561198xxxxx</strong>)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WakaTime 配置 (预留) */}
      <Card className="mb-6 opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            WakaTime 配置
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
              即将推出
            </span>
          </CardTitle>
          <CardDescription>
            监测 IDE 编程活动，显示编程状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="wakatimeKey">WakaTime API Key</Label>
            <Input
              id="wakatimeKey"
              type={showKeys ? "text" : "password"}
              value={config.wakatimeKey}
              onChange={(e) =>
                setConfig({ ...config, wakatimeKey: e.target.value })
              }
              placeholder="功能开发中..."
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          保存配置
        </Button>
      </div>
    </div>
  );
}
