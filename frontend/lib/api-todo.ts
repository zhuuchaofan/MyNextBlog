// lib/api-todo.ts
// 待办任务 API 客户端封装 - 支持 Epic → Story → Task 三层结构

import { fetchClient } from './fetchClient';

// ========== 类型定义 ==========

export type TaskType = 'epic' | 'story' | 'task';
export type TaskStage = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TodoTask {
  id: number;
  title: string;
  description: string | null;
  taskType: TaskType;
  stage: TaskStage;
  priority: TaskPriority;
  sortOrder: number;
  startDate: string | null;
  dueDate: string | null;
  parentId: number | null;
  reminderEnabled: boolean;
  reminderDays: string;           // "7,3,1,0"
  sentReminderDays: string | null;
  createdAt: string;
  updatedAt: string;
  children?: TodoTask[] | null;   // 子任务列表
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  taskType?: TaskType;
  stage?: TaskStage;
  priority?: TaskPriority;
  parentId?: number;
  startDate?: string;
  dueDate?: string;
  reminderEnabled?: boolean;
  reminderDays?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  taskType?: TaskType;
  stage?: TaskStage;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  reminderEnabled?: boolean;
  reminderDays?: string;
}

export interface MoveTodoDto {
  newStage: string;
  newSortOrder: number;
}

export interface TodoSortItem {
  id: number;
  stage: string;
  sortOrder: number;
}

// ========== 辅助常量 ==========

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  epic: '史诗',
  story: '故事',
  task: '任务',
};

export const TASK_STAGE_LABELS: Record<TaskStage, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

// ========== API 函数 ==========

/**
 * 获取所有待办任务 (返回树形结构)
 */
export async function fetchTodos(): Promise<TodoTask[]> {
  const res = await fetchClient<{ success: boolean; data: TodoTask[] }>(
    '/api/backend/admin/todos'
  );
  return res.data || [];
}

/**
 * 获取单个任务 (含子任务)
 */
export async function fetchTodo(id: number): Promise<TodoTask | null> {
  try {
    const res = await fetchClient<{ success: boolean; data: TodoTask }>(
      `/api/backend/admin/todos/${id}`
    );
    return res.data;
  } catch {
    return null;
  }
}

/**
 * 创建任务
 */
export async function createTodo(dto: CreateTodoDto): Promise<TodoTask> {
  const res = await fetchClient<{ success: boolean; data: TodoTask; message?: string }>(
    '/api/backend/admin/todos',
    {
      method: 'POST',
      body: dto,
    }
  );
  return res.data;
}

/**
 * 更新任务
 */
export async function updateTodo(id: number, dto: UpdateTodoDto): Promise<TodoTask> {
  const res = await fetchClient<{ success: boolean; data: TodoTask; message?: string }>(
    `/api/backend/admin/todos/${id}`,
    {
      method: 'PUT',
      body: dto,
    }
  );
  return res.data;
}

/**
 * 删除任务 (含级联删除子任务)
 */
export async function deleteTodo(id: number): Promise<void> {
  await fetchClient<{ success: boolean; message?: string }>(
    `/api/backend/admin/todos/${id}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * 移动任务到新阶段
 */
export async function moveTodo(id: number, dto: MoveTodoDto): Promise<void> {
  await fetchClient<{ success: boolean; message?: string }>(
    `/api/backend/admin/todos/${id}/move`,
    {
      method: 'PATCH',
      body: dto,
    }
  );
}

/**
 * 批量更新任务排序
 */
export async function batchUpdateTodoSort(items: TodoSortItem[]): Promise<void> {
  await fetchClient<{ success: boolean; message?: string }>(
    '/api/backend/admin/todos/batch-sort',
    {
      method: 'POST',
      body: { items },
    }
  );
}

// ========== 辅助函数 ==========

/**
 * 扁平化任务树 (用于搜索/过滤)
 */
export function flattenTasks(tasks: TodoTask[]): TodoTask[] {
  const result: TodoTask[] = [];
  
  function traverse(task: TodoTask) {
    result.push(task);
    task.children?.forEach(traverse);
  }
  
  tasks.forEach(traverse);
  return result;
}

/**
 * 计算任务总数 (含子任务)
 */
export function countTasks(tasks: TodoTask[]): number {
  return flattenTasks(tasks).length;
}

/**
 * 获取子任务数量
 */
export function countChildren(task: TodoTask): number {
  if (!task.children?.length) return 0;
  return task.children.length + task.children.reduce((sum, c) => sum + countChildren(c), 0);
}
