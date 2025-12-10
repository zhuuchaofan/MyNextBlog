'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
  chart: string;
}

// 初始化 mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

const MermaidBlock: React.FC<MermaidBlockProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!chart) return;

      try {
        // 生成唯一的 ID，避免多个图表冲突
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // mermaid.render 返回 { svg, bindFunctions }，但在旧版本可能直接返回 svg string
        // v10+ 返回 promise resolving to an object
        const { svg: svgContent } = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvg(svgContent);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError('无法渲染图表，请检查语法。');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900 text-sm font-mono">
        <p className="font-bold mb-2">Mermaid 渲染错误:</p>
        {error}
        <pre className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-container my-8 flex justify-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidBlock;
