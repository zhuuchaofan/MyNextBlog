'use client'; // 标记为客户端组件，因为包含大量的交互逻辑（编辑、预览、上传）

import { useState, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea"; // shadcn/ui 文本域组件
import ReactMarkdown from 'react-markdown'; // Markdown 解析器
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown 插件 (支持表格、删除线等)
import rehypeHighlight from 'rehype-highlight'; // 代码高亮插件
import { Button } from "@/components/ui/button"; // shadcn/ui 按钮组件
import { Bold, Italic, List, Image as ImageIcon, Eye, Code, Quote, Link as LinkIcon } from 'lucide-react'; // 图标库
import { toast } from 'sonner';
import 'highlight.js/styles/github-dark.css'; // 代码高亮样式
import imageCompression from 'browser-image-compression'; // 浏览器端图片压缩库

interface MarkdownEditorProps {
  value: string; // 编辑器的当前内容
  onChange: (value: string) => void; // 内容改变时的回调函数
}

/**
 * 功能丰富的 Markdown 编辑器组件
 * 支持：
 * 1. 实时 Markdown 语法预览
 * 2. 快捷工具栏 (加粗、斜体、引用等)
 * 3. 图片上传 (点击按钮、粘贴、拖拽)
 * 4. 浏览器端图片自动压缩 (.webp)
 */
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false); // 控制预览模式/编辑模式切换
  const textareaRef = useRef<HTMLTextAreaElement>(null); // 获取 Textarea DOM 元素的引用

  // 工具函数：在光标位置插入文本
  // before: 插入在选中文本之前的内容 (如 "**")
  // after: 插入在选中文本之后的内容 (如 "**")
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 获取光标位置或选中文本范围
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    // 拼接新文本
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    onChange(newText); // 触发父组件更新

    // 重新定位光标，使其位于插入内容之间，方便用户继续输入
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // 核心功能：处理图片上传
  const handleUpload = async (file: File) => {
    if (!file) return;

    // 1. 插入占位符，让用户知道正在上传
    const placeholder = `![上传中... (${file.name})]()`;
    insertText(placeholder);

    try {
      // 2. 图片压缩配置
      const options = {
        maxSizeMB: 1, // 最大 1MB
        maxWidthOrHeight: 1920, // 最大宽/高 1920px
        useWebWorker: true, // 使用 Web Worker 避免阻塞主线程
        fileType: 'image/webp' // 转换为 WebP 格式，体积更小
      };

      // 执行压缩
      const compressedFile = await imageCompression(file, options);
      // 构造新的文件名 (.webp)
      const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
      const uploadFile = new File([compressedFile], newFileName, { type: 'image/webp' });

      // 3. 构建 FormData 并上传
      const formData = new FormData();
      formData.append('file', uploadFile);

      // 调用后端上传接口 (通过 Next.js 代理)
      const res = await fetch('/api/backend/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('上传失败');

      const data = await res.json();
      
      // 4. 替换占位符为真实的 Markdown 图片语法
      const markdownImage = `![image](${data.url})`;
      const newContent = textareaRef.current?.value.replace(placeholder, markdownImage) || '';
      onChange(newContent);

    } catch (error) {
      console.error(error);
      toast.error('图片上传失败');
      // 上传失败，移除占位符
      const newContent = textareaRef.current?.value.replace(placeholder, '') || '';
      onChange(newContent);
    }
  };

  // 处理粘贴事件 (支持截图粘贴上传)
  const handlePaste = (e: React.ClipboardEvent) => {
    const files = e.clipboardData.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault(); // 阻止默认的粘贴行为 (防止粘贴文件路径)
        handleUpload(file); // 触发上传流程
      }
    }
  };

  // 处理拖拽事件 (支持文件拖入上传)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleUpload(file);
      }
    }
  };

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-colors">
      {/* --- 工具栏区域 --- */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton icon={<Bold className="w-4 h-4" />} onClick={() => insertText('**', '**')} title="加粗" />
          <ToolbarButton icon={<Italic className="w-4 h-4" />} onClick={() => insertText('*', '*')} title="斜体" />
          <ToolbarButton icon={<Quote className="w-4 h-4" />} onClick={() => insertText('> ')} title="引用" />
          <ToolbarButton icon={<Code className="w-4 h-4" />} onClick={() => insertText('```\n', '\n```')} title="代码块" />
          <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-2"></div>
          <ToolbarButton icon={<LinkIcon className="w-4 h-4" />} onClick={() => insertText('[', '](url)')} title="链接" />
          <ToolbarButton icon={<List className="w-4 h-4" />} onClick={() => insertText('- ')} title="列表" />
          {/* 图片上传按钮：点击触发隐藏的 input[type=file] */}
          <ToolbarButton icon={<ImageIcon className="w-4 h-4" />} onClick={() => document.getElementById('image-upload')?.click()} title="上传图片" />
          <input 
            type="file" 
            id="image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
          />
        </div>
        
        {/* 预览切换按钮 */}
        <Button 
          variant={preview ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => setPreview(!preview)}
          className="text-xs gap-2 dark:text-gray-300 dark:hover:bg-zinc-700"
        >
          <Eye className="w-4 h-4" />
          {preview ? '编辑模式' : '预览模式'}
        </Button>
      </div>

      {/* --- 编辑/预览区域 --- */}
      <div className="relative min-h-[500px]">
        {preview ? (
          // 预览模式：使用 ReactMarkdown 渲染
          <div className="prose prose-stone dark:prose-invert max-w-none p-6 h-[500px] overflow-y-auto bg-white dark:bg-zinc-900">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeHighlight]}
              components={{
                 // 自定义图片渲染，限制最大高度
                 img: ({node, ...props}) => (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img {...props} className="rounded-lg shadow-sm max-h-[400px] mx-auto dark:bg-zinc-800" alt={props.alt || ''} />
                 )
              }}
            >
              {value || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        ) : (
          // 编辑模式：原生 Textarea
          <Textarea 
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-full h-[500px] p-6 border-0 focus-visible:ring-0 rounded-none resize-none font-mono text-sm leading-relaxed bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-200 dark:placeholder:text-zinc-600"
            placeholder="开始创作... (支持 Markdown, 粘贴图片)"
          />
        )}
      </div>
      
      {/* 底部状态栏 */}
      <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-2 text-xs text-gray-400 dark:text-zinc-500 border-t border-gray-100 dark:border-zinc-800 flex justify-between transition-colors">
         <span>Markdown Supported</span>
         <span>{value.length} chars</span>
      </div>
    </div>
  );
}

// 辅助组件：工具栏按钮
function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400" onClick={onClick} title={title} type="button">
      {icon}
    </Button>
  )
}