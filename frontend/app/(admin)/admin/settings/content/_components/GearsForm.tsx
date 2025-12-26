"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface GearCategory {
  category: string;
  items: string[];
}

interface GearsFormProps {
  value: string;
  onChange: (json: string) => void;
}

export default function GearsForm({ value, onChange }: GearsFormProps) {
  let gears: GearCategory[] = [];
  try {
    if (value) gears = JSON.parse(value);
  } catch { /* 使用空数组 */ }

  const updateGears = (newGears: GearCategory[]) => {
    onChange(JSON.stringify(newGears, null, 2));
  };

  const addCategory = () => {
    updateGears([...gears, { category: "", items: [""] }]);
  };

  const removeCategory = (index: number) => {
    updateGears(gears.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index: number, name: string) => {
    const newGears = [...gears];
    newGears[index] = { ...newGears[index], category: name };
    updateGears(newGears);
  };

  const addItem = (catIndex: number) => {
    const newGears = [...gears];
    newGears[catIndex] = { ...newGears[catIndex], items: [...newGears[catIndex].items, ""] };
    updateGears(newGears);
  };

  const removeItem = (catIndex: number, itemIndex: number) => {
    const newGears = [...gears];
    newGears[catIndex] = {
      ...newGears[catIndex],
      items: newGears[catIndex].items.filter((_, i) => i !== itemIndex),
    };
    updateGears(newGears);
  };

  const updateItem = (catIndex: number, itemIndex: number, val: string) => {
    const newGears = [...gears];
    const newItems = [...newGears[catIndex].items];
    newItems[itemIndex] = val;
    newGears[catIndex] = { ...newGears[catIndex], items: newItems };
    updateGears(newGears);
  };

  return (
    <div className="space-y-4">
      {gears.map((gear, catIndex) => (
        <div key={catIndex} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg space-y-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => removeCategory(catIndex)}
          >
            <X className="w-3 h-3 text-gray-400" />
          </Button>
          <div>
            <Label className="text-[10px] text-gray-500">分类名</Label>
            <Input
              value={gear.category}
              onChange={(e) => updateCategoryName(catIndex, e.target.value)}
              placeholder="Hardware / Software"
              className="h-8 text-sm font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-500">物品</Label>
            {gear.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-1">
                <Input
                  value={item}
                  onChange={(e) => updateItem(catIndex, itemIndex, e.target.value)}
                  placeholder="Mac mini M4"
                  className="h-7 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => removeItem(catIndex, itemIndex)}
                >
                  <X className="w-3 h-3 text-gray-400" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-gray-500"
              onClick={() => addItem(catIndex)}
            >
              <Plus className="w-3 h-3 mr-0.5" /> 添加物品
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addCategory}>
        <Plus className="w-3 h-3 mr-1" /> 添加分类
      </Button>
    </div>
  );
}
