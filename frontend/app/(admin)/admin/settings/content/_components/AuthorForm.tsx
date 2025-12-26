"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthorData {
  name: string;
  avatar: string;
  location: string;
  description: string;
  social: {
    github: string;
    twitter: string;
    email: string;
  };
}

interface AuthorFormProps {
  value: string;
  onChange: (json: string) => void;
}

const DEFAULT_AUTHOR: AuthorData = {
  name: "",
  avatar: "",
  location: "",
  description: "",
  social: { github: "", twitter: "", email: "" },
};

export default function AuthorForm({ value, onChange }: AuthorFormProps) {
  // 解析 JSON 为表单数据
  let data: AuthorData = DEFAULT_AUTHOR;
  try {
    if (value) data = { ...DEFAULT_AUTHOR, ...JSON.parse(value) };
  } catch { /* 使用默认值 */ }

  // 更新字段
  const updateField = (field: keyof AuthorData, val: string) => {
    const newData = { ...data, [field]: val };
    onChange(JSON.stringify(newData, null, 2));
  };

  const updateSocial = (field: keyof AuthorData["social"], val: string) => {
    const newData = { ...data, social: { ...data.social, [field]: val } };
    onChange(JSON.stringify(newData, null, 2));
  };

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">名字</Label>
          <Input
            value={data.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="朱超凡"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">位置</Label>
          <Input
            value={data.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="日本·东京"
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">头像 URL</Label>
        <Input
          value={data.avatar}
          onChange={(e) => updateField("avatar", e.target.value)}
          placeholder="https://..."
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">简介</Label>
        <Input
          value={data.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="全栈开发者 / .NET / Next.js"
          className="h-9"
        />
      </div>

      {/* 社交链接 */}
      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
        <Label className="text-xs text-gray-500 mb-2 block">社交链接</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">GitHub</span>
            <Input
              value={data.social.github}
              onChange={(e) => updateSocial("github", e.target.value)}
              placeholder="https://github.com/..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Twitter</span>
            <Input
              value={data.social.twitter}
              onChange={(e) => updateSocial("twitter", e.target.value)}
              placeholder="https://twitter.com/..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Email</span>
            <Input
              value={data.social.email}
              onChange={(e) => updateSocial("email", e.target.value)}
              placeholder="example@gmail.com"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
