"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface TimelineFormProps {
  value: string;
  onChange: (json: string) => void;
}

const DEFAULT_ITEM: TimelineItem = { year: "", title: "", description: "" };

export default function TimelineForm({ value, onChange }: TimelineFormProps) {
  let items: TimelineItem[] = [];
  try {
    if (value) items = JSON.parse(value);
  } catch { /* 使用空数组 */ }

  const updateItems = (newItems: TimelineItem[]) => {
    onChange(JSON.stringify(newItems, null, 2));
  };

  const addItem = () => {
    updateItems([{ ...DEFAULT_ITEM }, ...items]); // 新增项放最前面
  };

  const removeItem = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TimelineItem, val: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    updateItems(newItems);
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addItem}>
        <Plus className="w-3 h-3 mr-1" /> 添加经历（最新在前）
      </Button>
      {items.map((item, index) => (
        <div key={index} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => removeItem(index)}
          >
            <X className="w-3 h-3 text-gray-400" />
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] text-gray-500">年份</Label>
              <Input
                value={item.year}
                onChange={(e) => updateItem(index, "year", e.target.value)}
                placeholder="2025.02"
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] text-gray-500">标题</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
                placeholder="赴日出向"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500">描述</Label>
            <Textarea
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="来到日本富士通总部..."
              className="text-xs min-h-[60px] resize-none"
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
