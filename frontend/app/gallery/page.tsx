'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Heart } from "lucide-react";

// 模拟相册数据
const CAT_PHOTOS = [
  { id: 1, src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800&auto=format&fit=crop", alt: "好奇的猫猫", title: "暗中观察", likes: 120 },
  { id: 2, src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=800&auto=format&fit=crop", alt: "伸懒腰", title: "午后小憩", likes: 89 },
  { id: 3, src: "https://images.unsplash.com/photo-1495360019602-e05980bf6f90?q=80&w=800&auto=format&fit=crop", alt: "两只猫", title: "形影不离", likes: 234 },
  { id: 4, src: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&auto=format&fit=crop", alt: "墨镜猫", title: "酷盖", likes: 567 },
  { id: 5, src: "https://images.unsplash.com/photo-1529778873920-4da4926a7071?q=80&w=800&auto=format&fit=crop", alt: "躲猫猫", title: "你看不到我", likes: 45 },
  { id: 6, src: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=800&auto=format&fit=crop", alt: "橘猫", title: "大橘为重", likes: 888 },
  { id: 7, src: "https://images.unsplash.com/photo-1506755855567-92ff770e8d00?q=80&w=800&auto=format&fit=crop", alt: "深邃眼神", title: "思考喵生", likes: 123 },
  { id: 8, src: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?q=80&w=800&auto=format&fit=crop", alt: "小奶猫", title: "还是个宝宝", likes: 321 },
  { id: 9, src: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop", alt: "黑猫", title: "黑夜骑士", likes: 77 },
];

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<typeof CAT_PHOTOS[0] | null>(null);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12 space-y-4">
        <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200">
          📸 喵星人图鉴
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
          球球 & 布丁的<span className="text-pink-500">私房照</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          记录每一刻的可爱与捣蛋。这里没有技术代码，只有毛茸茸的治愈力量。
        </p>
      </div>

      {/* Masonry Layout using CSS Columns */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
        {CAT_PHOTOS.map((photo) => (
          <div key={photo.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-zoom-in relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.src} 
                    alt={photo.alt} 
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {photo.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/80 mt-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      <Heart className="w-4 h-4 fill-white" /> {photo.likes}
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.src} 
                  alt={photo.alt} 
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                   <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>{photo.title}</span>
                   </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}
