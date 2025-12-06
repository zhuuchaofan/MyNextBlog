'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Image as ImageIcon, Eye, Code, Quote, Link as LinkIcon } from 'lucide-react';
import 'highlight.js/styles/github-dark.css'; 
import { useAuth } from '@/context/AuthContext';
import imageCompression from 'browser-image-compression'; // Import

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { token } = useAuth();

  // 插入文本辅助函数
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    onChange(newText);

    // 恢复光标位置并聚焦
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // 处理图片上传
  const handleUpload = async (file: File) => {
    if (!file || !token) return;

    // 1. 插入占位符
    const placeholder = `![上传中... (${file.name})]()`;
    insertText(placeholder);

    try {
      // 压缩配置
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      // 压缩图片
      const compressedFile = await imageCompression(file, options);
      // 创建一个新的 File 对象，保留原名但后缀改为 .webp (如果转换了的话)
      // browser-image-compression 返回的是 Blob 或 File。
      // 为了稳妥，我们可以重新包装一下，或者直接传，但要注意文件名后缀。
      const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
      const uploadFile = new File([compressedFile], newFileName, { type: 'image/webp' });

      // 2. 构建 FormData
      const formData = new FormData();
      formData.append('file', uploadFile);

      // 3. 上传
      const res = await fetch('/api/backend/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // JWT 认证
        },
        body: formData
      });

      if (!res.ok) throw new Error('上传失败');

      const data = await res.json();
      
      // 4. 替换占位符为真实 Markdown 链接
      const markdownImage = `![image](${data.url})`;
      const newContent = textareaRef.current?.value.replace(placeholder, markdownImage) || '';
      onChange(newContent);

    } catch (error) {
      console.error(error);
      alert('图片上传失败');
      // 移除占位符
      const newContent = textareaRef.current?.value.replace(placeholder, '') || '';
      onChange(newContent);
    }
  };

  // 监听粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    const files = e.clipboardData.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault(); // 阻止默认粘贴行为
        handleUpload(file);
      }
    }
  };

  // 监听拖拽事件
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
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton icon={<Bold className="w-4 h-4" />} onClick={() => insertText('**', '**')} title="加粗" />
          <ToolbarButton icon={<Italic className="w-4 h-4" />} onClick={() => insertText('*', '*')} title="斜体" />
          <ToolbarButton icon={<Quote className="w-4 h-4" />} onClick={() => insertText('> ')} title="引用" />
          <ToolbarButton icon={<Code className="w-4 h-4" />} onClick={() => insertText('```\n', '\n```')} title="代码块" />
          <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-2"></div>
          <ToolbarButton icon={<LinkIcon className="w-4 h-4" />} onClick={() => insertText('[', '](url)')} title="链接" />
          <ToolbarButton icon={<List className="w-4 h-4" />} onClick={() => insertText('- ')} title="列表" />
          <ToolbarButton icon={<ImageIcon className="w-4 h-4" />} onClick={() => document.getElementById('image-upload')?.click()} title="上传图片" />
          <input 
            type="file" 
            id="image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
          />
        </div>
        
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

      {/* 编辑区 / 预览区 */}
      <div className="relative min-h-[500px]">
        {preview ? (
          <div className="prose prose-stone dark:prose-invert max-w-none p-6 h-[500px] overflow-y-auto bg-white dark:bg-zinc-900">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeHighlight]}
              components={{
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
      
      <div className="bg-gray-50 dark:bg-zinc-800/50 px-4 py-2 text-xs text-gray-400 dark:text-zinc-500 border-t border-gray-100 dark:border-zinc-800 flex justify-between transition-colors">
         <span>Markdown Supported</span>
         <span>{value.length} chars</span>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400" onClick={onClick} title={title} type="button">
      {icon}
    </Button>
  )
}
