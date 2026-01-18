// lib/api-todo.ts
// 待办任务 API 客户端封装

import { fetchClient } from './fetchClient';

// ========== 类型定义 ==========

export interface TodoTask {
  id: number;
  title: string;
  description: string | null;
  stage: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  sortOrder: number;
  startDate: string | null;
  dueDate: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  stage?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  stage?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
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

// ========== API 函数 ==========

/**
 * 获取所有待办任务
 */
export async function fetchTodos(): Promise<TodoTask[]> {
  const res = await fetchClient<{ success: boolean; data: TodoTask[] }>(
    '/api/backend/admin/todos'
  );
  return res.data || [];
}

/**
 * 获取单个任务
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
 * 删除任务
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
