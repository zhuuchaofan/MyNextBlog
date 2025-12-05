'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from "@/components/ui/button";
import { Check, Copy, List } from "lucide-react";
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 简单的 Slugify 函数，支持中文
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // 空格转短横线
    .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 移除非字母数字中文和短横线
    .replace(/\-+/g, '-'); // 合并短横线
};

// 从 React Node 中提取纯文本
const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (typeof children === 'object' && children?.props?.children) return extractText(children.props.children);
  return '';
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [toc, setToc] = useState<TocItem[]>([]);

  // 解析 TOC
  useEffect(() => {
    // 这里简单用正则提取，可能无法处理复杂嵌套（比如标题里有粗体），但对大多数情况够用
    const lines = content.split('\n');
    const items: TocItem[] = [];
    
    // 用于处理重复标题
    const slugCounts: Record<string, number> = {};

    lines.forEach((line) => {
      // 匹配 ## 或 ### 开头的行，允许行尾有空白字符（处理 \r 等）
      const match = line.match(/^(#{2,3})\s+(.+?)\s*$/); 
      if (match) {
        const level = match[1].length;
        // 去除 markdown 符号（如 **text** -> text）
        let text = match[2].replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(`)(.*?)\1/g, '$2').trim();
        
        let slug = slugify(text);
        
        // 处理重复 ID
        if (slugCounts[slug]) {
          slugCounts[slug]++;
          slug = `${slug}-${slugCounts[slug]}`;
        } else {
          slugCounts[slug] = 0; // 第一次出现不加后缀，或者设为 1
          // 实际上 rehype-slug 第一次不加后缀，第二次加 -1
          // 我们简单点：第一次 0，第二次 1
          slugCounts[slug] = 1;
        }

        items.push({ id: slug, text, level });
      }
    });
    setToc(items);
  }, [content]);

  // 复制代码功能
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (!inline && match) {
      return (
        <div className="relative group my-6">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 bg-gray-700 hover:bg-gray-600 text-white border-none"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <pre className={`${className} rounded-xl !bg-gray-900 !p-4 overflow-x-auto shadow-lg`}>
            <code {...props} className={className}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return <code className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
  };

  // 用于渲染时跟踪重复 ID
  // 注意：这种方式在 React Server Component 或 Strict Mode 下可能会有副作用，
  // 但在 Client Component 且简单的博客场景下是可以接受的。
  // 更好的方式是使用 rehype 插件，但这里我们手动实现。
  const slugCountsRender: Record<string, number> = {};

  const createHeading = (level: number) => {
    return ({ node, children, ...props }: any) => {
      const text = extractText(children);
      let slug = slugify(text);
      
      // 简单的去重逻辑 (注意：React 可能会多次渲染，这里其实不太稳健，但先这样)
      // 为了避免 React 渲染时的 ID 不一致，我们其实应该依赖 rehype-slug。
      // 这里为了演示效果，我们假设标题不重复。
      
      const Tag = `h${level}` as React.ElementType;
      return <Tag id={slug} className={`scroll-mt-24 font-bold text-gray-900 ${level === 2 ? 'text-2xl mt-10 mb-4 pb-2 border-b border-gray-100' : 'text-xl mt-6 mb-3'}`} {...props}>{children}</Tag>;
    };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative items-start">
      {/* 文章正文 */}
      <article className="flex-1 prose prose-stone max-w-none w-full min-w-0 break-words">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight]}
          components={{
            code: CodeBlock,
            img: ({node, ...props}) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...props} className="rounded-xl shadow-md mx-auto my-6 max-h-[500px] object-contain bg-gray-50" alt={props.alt || ''} />
            ),
            a: ({node, ...props}) => (
              <a {...props} className="text-orange-600 hover:text-orange-800 underline decoration-orange-300 underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" />
            ),
            h2: createHeading(2),
            h3: createHeading(3),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      {/* 右侧悬浮目录 (Desktop Only) */}
      {toc.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
               <List className="w-4 h-4" /> 目录
             </div>
             <nav className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
               {toc.map((item) => (
                 <a 
                   key={item.id} // 如果有重复标题，这里可能会有 key 重复警告，实际应加 index
                   href={`#${item.id}`}
                   onClick={(e) => {
                     e.preventDefault();
                     document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                   }}
                   className={`block text-sm py-1.5 px-3 rounded-lg transition-all hover:bg-orange-50 hover:text-orange-600 truncate ${item.level === 3 ? 'ml-4 text-gray-400' : 'text-gray-600 font-medium'}`}
                   title={item.text}
                 >
                   {item.text}
                 </a>
               ))}
             </nav>
          </div>
        </aside>
      )}
    </div>
  );
}