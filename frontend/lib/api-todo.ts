// lib/api-todo.ts
// 待办任务 API 客户端封装

import { API_BASE_URL } from '@/lib/constants';

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
  startDate?: string | null;
  dueDate?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  stage?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string | null;
  dueDate?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
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
  const res = await fetch(`${API_BASE_URL}/api/admin/todos`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('获取任务列表失败');
  }
  
  const data = await res.json();
  return data.data || [];
}

/**
 * 获取单个任务
 */
export async function fetchTodo(id: number): Promise<TodoTask | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos/${id}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  return data.data;
}

/**
 * 创建任务
 */
export async function createTodo(dto: CreateTodoDto): Promise<TodoTask> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || '创建任务失败');
  }
  
  return data.data;
}

/**
 * 更新任务
 */
export async function updateTodo(id: number, dto: UpdateTodoDto): Promise<TodoTask> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || '更新任务失败');
  }
  
  return data.data;
}

/**
 * 删除任务
 */
export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || '删除任务失败');
  }
}

/**
 * 移动任务到新阶段
 */
export async function moveTodo(id: number, dto: MoveTodoDto): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || '移动任务失败');
  }
}

/**
 * 批量更新任务排序
 */
export async function batchUpdateTodoSort(items: TodoSortItem[]): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/todos/batch-sort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ items }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || '批量更新失败');
  }
}
