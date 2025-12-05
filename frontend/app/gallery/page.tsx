'use client';

import { useState, useEffect } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Camera, Image as ImageIcon } from 'lucide-react';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [index, setIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/gallery?pageSize=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) setImages(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 min-h-screen">
       <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">猫咪相册</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            这里收集了所有在博客文章中出现过的猫主子照片。每一张照片背后，都有一段关于代码与猫的故事。
          </p>
       </header>

       {loading ? (
         <div className="text-center py-20 text-gray-400">加载中...</div>
       ) : images.length === 0 ? (
         <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无照片</p>
            <p className="text-sm text-gray-400 mt-2">发布文章并打上“猫咪”标签，照片就会出现在这里哦！</p>
         </div>
       ) : (
         <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
           {images.map((img, i) => (
             <div key={img.id} className="break-inside-avoid mb-6 group relative cursor-zoom-in" onClick={() => setIndex(i)}>
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src={img.src} 
                 alt={img.alt} 
                 className="w-full rounded-2xl shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1" 
                 loading="lazy"
               />
               {/* Overlay Caption */}
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-end p-4 opacity-0 group-hover:opacity-100">
                 <p className="text-white text-sm font-medium truncate w-full drop-shadow-md">{img.alt}</p>
               </div>
             </div>
           ))}
         </div>
       )}

       <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images}
      />
    </div>
  );
}