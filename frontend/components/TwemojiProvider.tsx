"use client";

import { useEffect, useRef } from "react";
import twemoji from "@twemoji/api";

/**
 * TwemojiProvider - 保守版本的 Twemoji 初始化组件
 *
 * 🔧 修复 Hydration 错误的策略：
 * 1. 只在首次挂载后执行一次 twemoji.parse()
 * 2. **不使用 MutationObserver** 监听 DOM 变化
 * 3. 使用 requestAnimationFrame 延迟执行，确保在 React 渲染周期外操作
 *
 * ⚠️ 限制：动态加载的内容（如加载更多文章）中的 emoji 不会自动转换
 *          如果需要，可以在特定组件中手动调用 twemoji.parse(element)
 */
export default function TwemojiProvider() {
  const hasParsed = useRef(false);

  useEffect(() => {
    // 确保只执行一次
    if (hasParsed.current) return;
    hasParsed.current = true;

    // 使用 requestAnimationFrame 延迟到下一帧执行
    // 确保 React 的 hydration 已经完成
    requestAnimationFrame(() => {
      // 再延迟一帧，双重保险
      requestAnimationFrame(() => {
        twemoji.parse(document.body, {
          folder: "svg",
          ext: ".svg",
          className: "twemoji",
        });
      });
    });
  }, []);

  return null;
}
