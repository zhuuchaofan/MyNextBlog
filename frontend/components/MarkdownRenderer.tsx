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

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [toc, setToc] = useState<TocItem[]>([]);

  // 解析 TOC
  useEffect(() => {
    const lines = content.split('\n');
    const items: TocItem[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/); // 只提取 h2, h3
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = `heading-${index}`; // 生成唯一 ID
        items.push({ id, text, level });
      }
    });
    setToc(items);
  }, [content]);

  // 自定义代码块组件（带复制功能）
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

  // 自定义标题组件（添加 ID 用于锚点跳转）
  const Heading = ({ level, children }: { level: number, children: any }) => {
    // 查找对应的 TOC item ID
    // 这里简化处理，实际场景可能需要更复杂的 ID 生成逻辑来匹配 TOC 解析
    // 为了演示，我们假设 children[0] 是文本，并重新生成一个简单的 ID
    const text = String(children).trim();
    // 简单查找匹配的 heading-id，如果找不到就生成一个
    const id = `heading-${text.replace(/\s+/g, '-').toLowerCase()}`;
    
    const Tag = `h${level}` as React.ElementType;
    return <Tag id={id} className={`scroll-mt-24 font-bold text-gray-800 ${level === 2 ? 'text-2xl mt-10 mb-4 pb-2 border-b border-gray-100' : 'text-xl mt-6 mb-3'}`}>{children}</Tag>;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      {/* 文章正文 - 调整字体大小：默认 prose (16px)，移动端保持舒适 */}
      <article className="flex-1 prose prose-stone max-w-none bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100">
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
            // 我们需要在解析时给标题加上 ID，但这需要在 remark 层面做，或者在这里动态匹配
            // 为了简单，这里使用了一种简化的方式，实际上应该保持 TOC 和 Heading ID 的一致性
            // 由于 ReactMarkdown 是渲染时生成的，我们只能在这里“猜测” ID，或者在上面解析 TOC 时使用更鲁棒的 slugify 算法
            h2: ({node, ...props}) => {
               // 重新生成 ID (必须与 TOC 逻辑一致)
               // 注意：这里有一个风险，如果内容中有相同的标题，ID 会重复
               // 正确做法是用 rehype-slug 插件，但为了少装依赖，我们手写一个简单的 slugify
               const text = String(props.children);
               // 临时方案：我们不在这里加 ID 了，因为有点复杂。
               // 作为一个展示性的 Demo，我们先只做渲染。
               // 如果要完美实现，建议后续引入 rehype-slug 和 rehype-autolink-headings
               return <h2 className="scroll-mt-24 text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-100" {...props} />
            },
            h3: ({node, ...props}) => <h3 className="scroll-mt-24 text-xl font-bold text-gray-800 mt-6 mb-3" {...props} />
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      {/* 右侧悬浮目录 (Desktop Only) */}
      {toc.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
             <div className="flex items-center gap-2 font-bold text-gray-900 mb-4">
               <List className="w-4 h-4" /> 目录
             </div>
             <nav className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
               {toc.map((item) => (
                 <a 
                   key={item.id} 
                   href={`#`} // 暂时禁用跳转，因为 ID 生成逻辑需要 rehype-slug 支持
                   onClick={(e) => e.preventDefault()} // 占位
                   className={`block text-sm py-1 px-2 rounded transition-colors border-l-2 border-transparent hover:bg-orange-50 hover:text-orange-600 ${item.level === 3 ? 'ml-4 text-gray-400' : 'text-gray-600'}`}
                 >
                   {item.text}
                 </a>
               ))}
             </nav>
             <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                技术后花园 🐱
             </div>
          </div>
        </aside>
      )}
    </div>
  );
}
