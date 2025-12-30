'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Edit,
} from 'lucide-react';
import { SortableActivityItem } from './SortableActivityItem';
import { ActivityForm, type ActivityFormData } from './ActivityForm';

/**
 * PlanDay 类型定义
 */
export interface PlanDay {
  id: number;
  dayNumber: number;
  date: string;
  theme: string | null;
  activities: Array<{
    id: number;
    title: string;
    time: string | null;
    location: string | null;
    estimatedCost: number;
    actualCost: number;
    notes: string | null;
    sortOrder: number;
  }>;
}

/**
 * PlanDayCard 组件 Props
 */
interface PlanDayCardProps {
  day: PlanDay;
  onUpdateTheme: (dayId: number, theme: string) => Promise<void>;
  onDeleteDay: (dayId: number) => void;
  onAddActivity: (dayId: number, data: ActivityFormData) => Promise<void>;
  onUpdateActivity: (dayId: number, activityId: number, data: ActivityFormData) => Promise<void>;
  onDeleteActivity: (dayId: number, activityId: number) => Promise<void>;
  onReorder: (event: DragEndEvent, dayId: number) => Promise<void>;
}

/**
 * 计划日程卡片组件
 * 
 * @description 独立管理编辑状态，避免状态上浮到父组件。
 * 支持主题编辑、活动 CRUD、拖拽排序。
 */
export function PlanDayCard({
  day,
  onUpdateTheme,
  onDeleteDay,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onReorder,
}: PlanDayCardProps) {
  // 组件内部状态（下沉）
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [themeInput, setThemeInput] = useState(day.theme || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);

  // 拖拽 sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 保存主题
  const handleSaveTheme = async () => {
    await onUpdateTheme(day.id, themeInput);
    setIsEditingTheme(false);
  };

  return (
    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Day {day.dayNumber}
            </Badge>
            {isEditingTheme ? (
              <Input
                value={themeInput}
                onChange={e => setThemeInput(e.target.value)}
                onBlur={handleSaveTheme}
                onKeyDown={e => e.key === 'Enter' && handleSaveTheme()}
                className="w-48"
                autoFocus
              />
            ) : (
              <CardTitle
                className="text-lg cursor-pointer hover:text-blue-500"
                onClick={() => {
                  setIsEditingTheme(true);
                  setThemeInput(day.theme || '');
                }}
              >
                {day.theme || '点击添加主题'}
              </CardTitle>
            )}
            <span className="text-sm text-gray-500">{day.date}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => onDeleteDay(day.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* 活动列表 - 拖拽排序 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => onReorder(event, day.id)}
        >
          <SortableContext
            items={day.activities.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {day.activities.map(activity => (
                <SortableActivityItem key={activity.id} id={activity.id} isEditing={editingActivityId === activity.id}>
                  {editingActivityId === activity.id ? (
                    /* 编辑模式 */
                    <ActivityForm
                      mode="edit"
                      initialData={{
                        title: activity.title,
                        time: activity.time || '',
                        location: activity.location || '',
                        estimatedCost: activity.estimatedCost,
                        actualCost: activity.actualCost,
                        notes: activity.notes || '',
                      }}
                      onSubmit={async (data) => {
                        await onUpdateActivity(day.id, activity.id, data);
                        setEditingActivityId(null);
                      }}
                      onCancel={() => setEditingActivityId(null)}
                    />
                  ) : (
                    /* 显示模式 - Grid Layout */
                    <div className="group flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50/80 dark:bg-zinc-800/50 rounded-xl hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all">
                      
                      {/* Drag Handle */}
                      <div className="pt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      {/* Left Column: Time + Location (利用时间下方空白) */}
                      <div className="flex-shrink-0 w-14 sm:w-20 space-y-1">
                         {/* Time */}
                         {activity.time ? (
                           <div className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 text-xs font-bold font-mono tracking-wide">
                             {activity.time}
                           </div>
                         ) : (
                           <div className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-gray-300 dark:text-zinc-700 text-xs font-mono tracking-wide select-none">
                             --:--
                           </div>
                         )}
                         {/* Location under time (always show with placeholder) */}
                         <div className="flex items-start gap-0.5 text-xs text-gray-400 leading-tight">
                           <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                           <span className={`break-words ${activity.location ? 'text-gray-500' : 'text-gray-300 dark:text-zinc-600'}`}>
                             {activity.location || '暂无'}
                           </span>
                         </div>
                      </div>

                      {/* Right Column: Title + Costs + Notes */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setEditingActivityId(activity.id)}
                      >
                         {/* Title + Costs Row */}
                         <div className="flex items-start justify-between gap-2">
                           <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">
                             {activity.title}
                           </h4>
                           {/* Costs (always show with placeholder) */}
                           <div className="flex items-center gap-1 flex-shrink-0">
                             <Badge variant="secondary" className={`font-mono text-xs px-1 py-0 border-none ${
                               activity.estimatedCost > 0 
                                 ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                 : 'text-gray-300 bg-gray-50 dark:text-zinc-600 dark:bg-zinc-800'
                             }`}>
                               ¥{activity.estimatedCost || 0}
                             </Badge>
                             <Badge variant="secondary" className={`font-mono text-xs px-1 py-0 border-none ${
                               activity.actualCost > 0 
                                 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                                 : 'text-gray-300 bg-gray-50 dark:text-zinc-600 dark:bg-zinc-800'
                             }`}>
                               实¥{activity.actualCost || 0}
                             </Badge>
                           </div>
                         </div>

                         {activity.notes && (
                           <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-900/50 p-2 rounded-lg border border-gray-100 dark:border-zinc-800 line-clamp-2">
                             {activity.notes}
                           </p>
                         )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActivityId(activity.id);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteActivity(day.id, activity.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                    </div>
                  )}
                </SortableActivityItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* 添加活动区域 */}
        {showAddForm ? (
          <div className="mt-3">
            <ActivityForm
              mode="add"
              onSubmit={async (data) => {
                await onAddActivity(day.id, data);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-gray-500"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> 添加活动
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
