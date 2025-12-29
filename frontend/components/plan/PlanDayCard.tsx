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
  Clock,
  DollarSign,
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
            <div className="space-y-2">
              {day.activities.map(activity => (
                <SortableActivityItem key={activity.id} id={activity.id}>
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
                    /* 显示模式 */
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                        <div
                          onClick={() => setEditingActivityId(activity.id)}
                          className="cursor-pointer"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {activity.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {activity.time}
                              </span>
                            )}
                            {activity.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {activity.location}
                              </span>
                            )}
                            {activity.estimatedCost > 0 && (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-3 h-3" /> 预估 {activity.estimatedCost}
                              </span>
                            )}
                            {activity.actualCost > 0 && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <DollarSign className="w-3 h-3" /> 实际 {activity.actualCost}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-blue-500"
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
                          className="opacity-0 group-hover:opacity-100 text-red-500"
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
