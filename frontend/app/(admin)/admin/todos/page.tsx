import { Suspense } from 'react';
import { PageContainer } from '@/components/common';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { TodoBoard } from '@/components/todos';

export const metadata = {
  title: '待办任务 | 管理后台',
  description: '管理待办任务看板',
};

/**
 * 待办任务管理页面
 */
export default function TodosPage() {
  return (
    <PageContainer variant="admin" maxWidth="7xl">
      <AdminPageHeader
        title="📋 待办任务"
        description="Kanban 看板式任务管理，支持拖拽调整阶段和排序"
      />
      
      <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
        <TodoBoard />
      </Suspense>
    </PageContainer>
  );
}
