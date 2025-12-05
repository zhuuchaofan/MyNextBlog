'use client';

import { useState, KeyboardEvent } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value = [], onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = input.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // 如果输入框为空且按退格，删除最后一个标签
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 border border-input rounded-md p-2 bg-white focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[42px]">
      {value.map(tag => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Input 
        className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[120px] h-7 p-0 text-sm" 
        placeholder={value.length === 0 ? "输入标签，按回车添加..." : ""}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}