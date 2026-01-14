// ============================================================================
// app/(public)/friends/page.tsx - 友链页面
// ============================================================================
// 展示所有启用的友链，包含实时在线状态。

import { Metadata } from 'next';
import Link from 'next/link';
import { Users, UserPlus } from 'lucide-react';
import { FriendCard } from './_components/FriendCard';
import { PageContainer, EmptyState } from '@/components/common';

// 强制动态渲染，确保获取最新数据
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '友情链接',
  description: '互联网上志同道合的朋友们',
};

// 友链类型定义
interface FriendLink {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  latencyMs: number | null;
  lastCheckTime: string | null;
  displayOrder: number;
}

// 获取友链列表 (Server-Side)
async function getFriendLinks(): Promise<FriendLink[]> {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  try {
    const res = await fetch(`${backendUrl}/api/friend-links`, {
      next: { revalidate: 300 } // ISR 缓存 5 分钟
    });
    
    if (!res.ok) return [];
    
    const json = await res.json();
    if (!json.success) return [];
    
    return json.data;
  } catch (error) {
    console.error('Failed to fetch friend links:', error);
    return [];
  }
}

export default async function FriendsPage() {
  const friends = await getFriendLinks();
  
  // 统计在线数量
  const onlineCount = friends.filter(f => f.isOnline).length;

  return (
    <PageContainer variant="public" maxWidth="5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          友情链接
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          互联网上志同道合的朋友们，实时检测在线状态
        </p>
        {friends.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              共 {friends.length} 个友链
            </span>
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {onlineCount} 个在线
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      {friends.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-12 h-12" />}
          title="暂无友链"
          description="欢迎互换友链，一起交流学习"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map(friend => (
            <Link 
              key={friend.id} 
              href={friend.url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FriendCard friend={friend} />
            </Link>
          ))}
        </div>
      )}

      {/* 申请友链提示 */}
      <div className="mt-16 text-center py-8 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          想要交换友链？
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          欢迎通过邮件联系我申请友链，格式：站点名称 + URL + 描述 + Logo
        </p>
        <Link 
          href="mailto:zhuuchaofan@gmail.com?subject=友链申请" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          申请友链
        </Link>
      </div>
    </PageContainer>
  );
}
