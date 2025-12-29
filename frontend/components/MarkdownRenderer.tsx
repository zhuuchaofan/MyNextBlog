'use client';

import React, { useState, useRef } from 'react';
import { useTocHighlight } from '@/hooks/useTocHighlight';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import { Button } from "@/components/ui/button";
import { Check, Copy, List } from "lucide-react";
import dynamic from 'next/dynamic'; // 引入 dynamic
import 'highlight.js/styles/github-dark.css';

// Lightbox 引入
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// 动态导入 MermaidBlock，禁用 SSR 因为 mermaid 依赖 window
const MermaidBlock = dynamic(() => import('@/components/MermaidBlock'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-32 bg-gray-100 dark:bg-zinc-800 rounded-xl my-6"></div>
});

interface MarkdownRendererProps {
  content: string;
}


interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 从 React Node 中提取纯文本
const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (typeof children === 'object' && children?.props?.children) return extractText(children.props.children);
  return '';
};

// ===========================================================================
// 新的 PreBlock 组件，处理 <pre> 标签的渲染 (包括复制按钮和外部容器)
// ===========================================================================
const PreBlock = ({ children, ...props }: any) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (preRef.current) {
      // innerText 会获取 <pre> 内部所有文本，包括高亮 span 的内容
      navigator.clipboard.writeText(preRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 提取 children 中的 className (通常在 <code> 标签上)
  let languageClassName = '';
  const child = Array.isArray(children) ? children[0] : children;

  if (React.isValidElement(child)) {
    // 不再检查 type === 'code'，因为可能是自定义组件
    if (typeof child.props === 'object' && child.props !== null && 'className' in child.props) {
      languageClassName = (child.props as any).className;
    }
  }

  // 检查是否是 mermaid 代码块
  if (languageClassName?.includes('mermaid')) {
    const chartContent = extractText(children);
    // console.log('Found mermaid block:', chartContent);
    return <MermaidBlock chart={chartContent} />;
  }

  return (
    <div className="relative group my-6">
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 bg-gray-700/80 hover:bg-gray-600 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
        onClick={handleCopy}
        aria-label={copied ? "已复制" : "复制代码"}
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre
        ref={preRef}
        className={`${languageClassName} rounded-xl !bg-gray-900 !p-4 overflow-x-auto shadow-lg custom-scrollbar-code`}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};

// ===========================================================================
// CodeBlock - 处理行内代码样式
// ===========================================================================
const CodeBlock = ({ className, children, ...props }: React.ComponentProps<'code'>) => {
  const inlineClasses = `
    [:not(pre)>&]:bg-orange-50 [:not(pre)>&]:text-orange-600 
    dark:[:not(pre)>&]:bg-zinc-800 dark:[:not(pre)>&]:text-orange-400
    [:not(pre)>&]:px-1.5 [:not(pre)>&]:py-0.5 [:not(pre)>&]:rounded [:not(pre)>&]:font-mono [:not(pre)>&]:text-sm
  `.replace(/\s+/g, ' ');

  return <code {...props} className={`${className || ''} ${inlineClasses}`.trim()}>{children}</code>;
};

// ===========================================================================
// HeadingRenderer - 标题通用样式组件
// ===========================================================================
const HeadingRenderer = ({ level, children, ...props }: { level: number; children?: React.ReactNode } & React.ComponentProps<'h2'>) => {
  const Tag = `h${level}` as React.ElementType;
  
  const styles = level === 2 
    ? 'text-2xl mt-10 mb-4 pb-2 border-b border-gray-100 dark:border-zinc-800' 
    : 'text-xl mt-6 mb-3';
    
  return (
    <Tag 
      className={`scroll-mt-24 font-bold text-gray-900 dark:text-gray-100 ${styles}`} 
      {...props}
    >
      {children}
    </Tag>
  );
};


export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // 使用 useMemo 解析 TOC 和图片列表（避免 useEffect 中 setState 的 lint 警告）
  const { toc, images } = React.useMemo(() => {
    const slugger = new GithubSlugger();
    const lines = content.split('\n');
    const tocItems: TocItem[] = [];
    const extractedImages: string[] = [];

    // 提取图片
    const imgRegex = /!\[.*?\]\((.*?)\)/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      if (imgMatch[1]) {
        extractedImages.push(imgMatch[1]);
      }
    }

    // 提取标题
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(`)(.*?)\1/g, '$2').trim();
        const slug = slugger.slug(text);
        tocItems.push({ id: slug, text, level });
      }
    });

    return { toc: tocItems, images: extractedImages };
  }, [content]);

  // 使用自定义 Hook 处理目录高亮
  const activeId = useTocHighlight(toc);
  return (
    <div className="flex flex-col lg:flex-row gap-8 relative items-start">
      {/* 文章正文 */}
      <article className="flex-1 prose prose-stone dark:prose-invert max-w-none w-full min-w-0 break-words">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight, rehypeSlug]}
          components={{
            pre: PreBlock, // 使用新的 PreBlock 组件处理 <pre>
            code: CodeBlock, // 使用修改后的 CodeBlock 组件处理 <code>
            img: ({node, ...props}) => {
               const src = props.src || '';
               return (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  {...props} 
                                     onClick={() => {
                                       const srcString = String(src); // 确保 src 是字符串类型
                                       const index = images.indexOf(srcString);                    if (index >= 0) {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                    }
                  }}
                  className="rounded-xl shadow-md mx-auto my-6 max-h-[500px] object-contain bg-gray-50 dark:bg-zinc-800 cursor-zoom-in hover:opacity-95 transition-opacity" 
                  alt={props.alt || ''} 
                  loading="lazy" // 开启懒加载
                />
              );
            },
            a: ({node, ...props}) => (
              <a {...props} className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline decoration-orange-300 dark:decoration-orange-700 underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" />
            ),
            h2: (props) => <HeadingRenderer level={2} {...props} />,
            h3: (props) => <HeadingRenderer level={3} {...props} />,
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-zinc-800">
                <table {...props} className="w-full text-sm text-left" />
              </div>
            ),
            thead: ({node, ...props}) => (
              <thead {...props} className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-medium" />
            ),
            th: ({node, ...props}) => (
              <th {...props} className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 whitespace-nowrap" />
            ),
            td: ({node, ...props}) => (
              <td {...props} className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      
      {/* 图片灯箱 */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images.map(src => ({ src }))}
      />

      {/* 右侧悬浮目录 (Desktop Only) */}
      {toc.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <div className="p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
             <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 mb-4">
               <List className="w-4 h-4" /> 目录
             </div>
             <nav className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
               {toc.map((item) => (
                 <a 
                   key={item.id}
                   href={`#${item.id}`}
                   onClick={(e) => {
                     e.preventDefault();
                     document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                   }}
                   className={`block text-sm py-1.5 px-3 rounded-lg transition-all truncate ${
                     activeId === item.id
                       ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold'
                       : item.level === 3
                         ? 'ml-4 text-gray-400 dark:text-gray-500 hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400'
                         : 'text-gray-600 dark:text-gray-400 font-medium hover:bg-orange-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400'
                   }`}
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