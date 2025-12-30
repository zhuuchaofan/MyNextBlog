'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Plus } from 'lucide-react';

/**
 * 活动表单数据结构
 */
export interface ActivityFormData {
  title: string;
  time: string;
  location: string;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
}

/**
 * 活动表单组件 Props
 */
interface ActivityFormProps {
  /** 表单模式：添加或编辑 */
  mode: 'add' | 'edit';
  /** 初始数据（编辑模式时使用） */
  initialData?: Partial<ActivityFormData>;
  /** 提交回调 */
  onSubmit: (data: ActivityFormData) => Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
}

/**
 * 活动表单组件
 * 
 * @description 自管理表单状态，避免输入时触发父组件重渲染。
 * 支持"添加"和"编辑"两种模式，编辑模式下显示额外的"实际花费"和"备注"字段。
 */
export function ActivityForm({ mode, initialData, onSubmit, onCancel }: ActivityFormProps) {
  // 表单状态下沉到组件内部
  const [formData, setFormData] = useState<ActivityFormData>({
    title: initialData?.title || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    estimatedCost: initialData?.estimatedCost || 0,
    actualCost: initialData?.actualCost || 0,
    notes: initialData?.notes || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return; // 父组件会处理 toast
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof ActivityFormData>(field: K, value: ActivityFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isEditMode = mode === 'edit';

  return (
    <div className={`p-2 sm:p-3 rounded-lg border space-y-3 ${
      isEditMode 
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
        : 'border-dashed dark:border-zinc-700'
    }`}>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Input
          placeholder="活动名称 *"
          className="text-sm sm:text-base"
          value={formData.title}
          onChange={e => updateField('title', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          type="time"
          className="text-sm sm:text-base"
          value={formData.time}
          onChange={e => updateField('time', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          placeholder="地点"
          className="text-sm sm:text-base"
          value={formData.location}
          onChange={e => updateField('location', e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          type="number"
          placeholder="预估花费"
          className="text-sm sm:text-base"
          value={formData.estimatedCost || ''}
          onChange={e => updateField('estimatedCost', Number(e.target.value))}
          disabled={isSubmitting}
        />
        
        {/* 编辑模式额外字段 */}
        {isEditMode && (
          <>
            <Input
              type="number"
              placeholder="实际花费"
              className="text-sm sm:text-base"
              value={formData.actualCost || ''}
              onChange={e => updateField('actualCost', Number(e.target.value))}
              disabled={isSubmitting}
            />
            <Input
              placeholder="备注"
              className="text-sm sm:text-base"
              value={formData.notes || ''}
              onChange={e => updateField('notes', e.target.value)}
              disabled={isSubmitting}
            />
          </>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
          {isEditMode ? (
            <><Check className="w-4 h-4 mr-1" /> 保存</>
          ) : (
            <><Plus className="w-4 h-4 mr-1" /> 添加</>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          <X className="w-4 h-4 mr-1" /> 取消
        </Button>
      </div>
    </div>
  );
}
