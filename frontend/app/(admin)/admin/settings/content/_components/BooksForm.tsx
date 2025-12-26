"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface BookItem {
  title: string;
  status: string;
  cover: string;
}

interface BooksFormProps {
  value: string;
  onChange: (json: string) => void;
}

const DEFAULT_BOOK: BookItem = { title: "", status: "Reading", cover: "📖" };
const STATUS_OPTIONS = ["Reading", "Want", "Done"];
const EMOJI_OPTIONS = ["📖", "📚", "🔨", "🌐", "💡", "🎯", "🚀", "💻", "🎨", "📝"];

export default function BooksForm({ value, onChange }: BooksFormProps) {
  let books: BookItem[] = [];
  try {
    if (value) books = JSON.parse(value);
  } catch { /* 使用空数组 */ }

  const updateBooks = (newBooks: BookItem[]) => {
    onChange(JSON.stringify(newBooks, null, 2));
  };

  const addBook = () => {
    updateBooks([...books, { ...DEFAULT_BOOK }]);
  };

  const removeBook = (index: number) => {
    updateBooks(books.filter((_, i) => i !== index));
  };

  const updateBook = (index: number, field: keyof BookItem, val: string) => {
    const newBooks = [...books];
    newBooks[index] = { ...newBooks[index], [field]: val };
    updateBooks(newBooks);
  };

  return (
    <div className="space-y-3">
      {books.map((book, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
          <Select value={book.cover} onValueChange={(v: string) => updateBook(index, "cover", v)}>
            <SelectTrigger className="w-16 h-8 text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMOJI_OPTIONS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={book.title}
            onChange={(e) => updateBook(index, "title", e.target.value)}
            placeholder="书名"
            className="flex-1 h-8 text-sm"
          />
          <Select value={book.status} onValueChange={(v: string) => updateBook(index, "status", v)}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s === "Reading" ? "在读" : s === "Want" ? "想读" : "已读"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeBook(index)}>
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addBook}>
        <Plus className="w-3 h-3 mr-1" /> 添加书籍
      </Button>
    </div>
  );
}
