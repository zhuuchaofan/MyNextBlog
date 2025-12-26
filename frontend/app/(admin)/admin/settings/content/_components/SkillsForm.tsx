"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Skill {
  name: string;
  icon: string;
  level: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

interface SkillsFormProps {
  value: string;
  onChange: (json: string) => void;
}

const ICON_OPTIONS = ["Server", "Code2", "Database", "GitGraph", "Layout", "Globe", "Palette", "Container", "Terminal"];
const LEVEL_OPTIONS = ["精通", "熟练", "掌握", "初学"];

const DEFAULT_SKILL: Skill = { name: "", icon: "Code2", level: "掌握" };

export default function SkillsForm({ value, onChange }: SkillsFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  let categories: SkillCategory[] = [];
  try {
    if (value) categories = JSON.parse(value);
  } catch { /* 使用空数组 */ }

  const updateCategories = (newCategories: SkillCategory[]) => {
    onChange(JSON.stringify(newCategories, null, 2));
  };

  const addCategory = () => {
    updateCategories([...categories, { title: "", skills: [{ ...DEFAULT_SKILL }] }]);
    setExpandedIndex(categories.length);
  };

  const removeCategory = (index: number) => {
    updateCategories(categories.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const updateCategoryTitle = (index: number, title: string) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], title };
    updateCategories(newCategories);
  };

  const addSkill = (catIndex: number) => {
    const newCategories = [...categories];
    newCategories[catIndex] = {
      ...newCategories[catIndex],
      skills: [...newCategories[catIndex].skills, { ...DEFAULT_SKILL }],
    };
    updateCategories(newCategories);
  };

  const removeSkill = (catIndex: number, skillIndex: number) => {
    const newCategories = [...categories];
    newCategories[catIndex] = {
      ...newCategories[catIndex],
      skills: newCategories[catIndex].skills.filter((_, i) => i !== skillIndex),
    };
    updateCategories(newCategories);
  };

  const updateSkill = (catIndex: number, skillIndex: number, field: keyof Skill, val: string) => {
    const newCategories = [...categories];
    const newSkills = [...newCategories[catIndex].skills];
    newSkills[skillIndex] = { ...newSkills[skillIndex], [field]: val };
    newCategories[catIndex] = { ...newCategories[catIndex], skills: newSkills };
    updateCategories(newCategories);
  };

  return (
    <div className="space-y-3">
      {categories.map((cat, catIndex) => (
        <div key={catIndex} className="border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden">
          {/* 分类标题 */}
          <div
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800/50 cursor-pointer"
            onClick={() => setExpandedIndex(expandedIndex === catIndex ? null : catIndex)}
          >
            {expandedIndex === catIndex ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
            <Input
              value={cat.title}
              onChange={(e) => {
                e.stopPropagation();
                updateCategoryTitle(catIndex, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="后端与数据库"
              className="h-7 text-sm font-medium flex-1"
            />
            <span className="text-xs text-gray-400">{cat.skills.length} 技能</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                removeCategory(catIndex);
              }}
            >
              <X className="w-3 h-3 text-gray-400" />
            </Button>
          </div>

          {/* 技能列表（可折叠） */}
          {expandedIndex === catIndex && (
            <div className="p-2 space-y-1.5">
              {cat.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="flex items-center gap-1.5">
                  <Select value={skill.icon} onValueChange={(v: string) => updateSkill(catIndex, skillIndex, "icon", v)}>
                    <SelectTrigger className="w-24 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon} className="text-xs">{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={skill.name}
                    onChange={(e) => updateSkill(catIndex, skillIndex, "name", e.target.value)}
                    placeholder="技能名"
                    className="flex-1 h-7 text-xs"
                  />
                  <Select value={skill.level} onValueChange={(v: string) => updateSkill(catIndex, skillIndex, "level", v)}>
                    <SelectTrigger className="w-20 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((level) => (
                        <SelectItem key={level} value={level} className="text-xs">{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeSkill(catIndex, skillIndex)}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-gray-500 w-full"
                onClick={() => addSkill(catIndex)}
              >
                <Plus className="w-3 h-3 mr-0.5" /> 添加技能
              </Button>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addCategory}>
        <Plus className="w-3 h-3 mr-1" /> 添加分类
      </Button>
    </div>
  );
}
