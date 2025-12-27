"use client";

import { useEffect } from "react";
import twemoji from "@twemoji/api";

/**
 * TwemojiProvider - 自动将页面中的 emoji 字符转换为 Twemoji SVG
 * 
 * 原理：使用 MutationObserver 监听 DOM 变化，自动解析新内容中的 emoji
 * 效果：所有平台显示统一的 Twitter 风格 emoji
 */
export default function TwemojiProvider() {
  useEffect(() => {
    // 初始解析整个页面
    twemoji.parse(document.body, {
      folder: "svg",
      ext: ".svg",
      className: "twemoji",
    });

    // 监听 DOM 变化，自动解析新内容
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            twemoji.parse(node as HTMLElement, {
              folder: "svg",
              ext: ".svg",
              className: "twemoji",
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
