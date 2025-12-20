'use client'; // 标记为客户端组件，因为需要使用 useState, useEffect 和处理用户交互（点击图片）

import { useState, useEffect } from 'react';
import Lightbox from "yet-another-react-lightbox"; // 导入图片灯箱库
import "yet-another-react-lightbox/styles.css"; // 导入灯箱库的样式
import { Camera, Image as ImageIcon } from 'lucide-react'; // 图标库

// 定义图库图片的数据接口
interface GalleryImage {
  id: number;
  src: string; // 图片 URL
  alt: string; // 图片描述 (通常是文章标题)
  width: number;
  height: number;
}

/**
 * GalleryPage 组件：图库页面
 * --------------------------------------------------------------------------------
 * 这是一个客户端组件，用于展示所有文章中出现过的图片。
 * 它从后端获取图片列表，并以瀑布流（Masonry）布局展示，点击图片可弹出灯箱进行查看。
 */
export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]); // 存储图库图片列表
  const [index, setIndex] = useState(-1); // 控制 Lightbox 当前显示的图片索引，-1 表示关闭
  const [loading, setLoading] = useState(true); // 控制加载状态

  // `useEffect` 钩子，在组件首次挂载时获取图片数据
  useEffect(() => {
    // 调用 API 获取所有图库图片。`pageSize=100` 适用于小规模博客。
    fetch('/api/backend/gallery?pageSize=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) setImages(data.data); // 更新图片列表状态
        setLoading(false); // 加载完成
      })
      .catch(() => setLoading(false)); // 捕获错误，也结束加载状态
  }, []); // 空依赖数组，只在组件首次渲染时执行一次

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 min-h-screen">
       {/* 页面头部：标题和描述 */}
       <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">猫咪相册</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            这里收集了所有在博客文章中出现过的猫主子照片。每一张照片背后，都有一段关于代码与猫的故事。
          </p>
       </header>

       {/* 根据加载状态和图片数量显示不同的内容 */}
       {loading ? (
         <div className="text-center py-20 text-gray-400 dark:text-gray-500">图片加载中...</div>
       ) : images.length === 0 ? (
         // 如果没有图片，显示占位符和提示
         <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
            <ImageIcon className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无照片</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">发布文章并打上“猫咪”标签，照片就会出现在这里哦！</p>
         </div>
       ) : (
         // 图片列表：使用 CSS Column 布局实现瀑布流效果
         <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
           {images.map((img, i) => (
             <div key={img.id} className="break-inside-avoid mb-6 group relative cursor-zoom-in" onClick={() => setIndex(i)}>
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src={img.src} 
                 alt={img.alt} 
                 className="w-full rounded-2xl shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 bg-gray-100 dark:bg-zinc-800" 
                 style={{ aspectRatio: `${img.width} / ${img.height}` }}
                 loading="lazy" // 懒加载图片，提高页面性能
               />
               {/* 图片悬停时的标题覆盖层 */}
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-end p-4 opacity-0 group-hover:opacity-100">
                 <p className="text-white text-sm font-medium truncate w-full drop-shadow-md">{img.alt}</p>
               </div>
             </div>
           ))}
         </div>
       )}

       {/* 图片灯箱 (Lightbox) 组件 */}
       <Lightbox
        open={index >= 0} // 当 index >= 0 时显示灯箱
        index={index}    // 设置灯箱当前显示的图片索引
        close={() => setIndex(-1)} // 关闭灯箱时重置 index
        slides={images}  // 提供所有图片数据给灯箱
      />
    </div>
  );
}