import { Suspense } from 'react';
import { getAdminPostsServer } from '@/lib/data';
import AdminPostsClient from './AdminPostsClient';

/**
 * AdminPostsPage - 文章管理列表页 (Server Component)
 * --------------------------------------------------------------------------------
 * 此页面在服务端预取第一页的文章数据，消除客户端加载闪烁。
 * 交互逻辑（翻页、删除等）由 AdminPostsClient 客户端组件处理。
 */
export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 从 URL 获取页码参数
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  
  // 服务端预取数据
  const { posts, meta } = await getAdminPostsServer(page, 10);

  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500 dark:text-gray-400">加载中...</div>}>
      <AdminPostsClient initialPosts={posts} initialMeta={meta} />
    </Suspense>
  );
}
