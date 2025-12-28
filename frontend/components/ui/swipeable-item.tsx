"use client";

import React, { useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  editColor?: string;
  deleteColor?: string;
}

export function SwipeableItem({
  children,
  onEdit,
  onDelete,
  className = "",
  editColor = "bg-blue-500",
  deleteColor = "bg-red-500",
}: SwipeableItemProps) {
  const controls = useAnimation();
  const [isOpen, setIsOpen] = useState(false);
  
  // 拖拽结束处理
  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // 向左滑动很大距离，或者速度很快 -> 打开菜单
    if (offset < -60 || (offset < -20 && velocity < -300)) {
      await controls.start({ x: -140 }); // 露出两个按钮的宽度
      setIsOpen(true);
    } else {
      await controls.start({ x: 0 });
      setIsOpen(false);
    }
  };

  // 点击内容区域时，如果菜单打开，则关闭
  const handleContentClick = () => {
    if (isOpen) {
      controls.start({ x: 0 });
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 背景操作按钮层 */}
      <div className="absolute inset-y-0 right-0 flex w-[140px] z-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
            controls.start({ x: 0 });
            setIsOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center text-white ${editColor} hover:brightness-90 transition-all`}
        >
          <Edit className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">编辑</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
            controls.start({ x: 0 });
            setIsOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center text-white ${deleteColor} hover:brightness-90 transition-all`}
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">删除</span>
        </button>
      </div>

      {/* 前景内容层 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={handleContentClick}
        className="relative z-10 bg-white dark:bg-zinc-900"
        style={{ touchAction: "pan-y" }} // 重要：允许垂直滚动
      >
        {children}
      </motion.div>
    </div>
  );
}
