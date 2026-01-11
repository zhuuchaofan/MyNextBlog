'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type FriendLink } from '@/lib/api';

interface FriendCardProps {
  friend: FriendLink;
}

/**
 * 从 URL 获取网站 Favicon
 * 使用 Google Favicon 服务：https://www.google.com/s2/favicons?domain=xxx&sz=64
 */
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    // URL 解析失败时返回默认图标
    return `https://api.dicebear.com/7.x/initials/svg?seed=?`;
  }
}

/**
 * 友链卡片组件
 * - 在线: 右上角绿色呼吸灯 + 显示延迟
 * - 离线: 红色/灰色点 + 灰度滤镜
 */
export function FriendCard({ friend }: FriendCardProps) {
  return (
    <Card className={`group relative overflow-hidden border border-gray-100 dark:border-zinc-800 
      hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-lg transition-all duration-300
      ${!friend.isOnline ? 'opacity-70' : ''}`}>
      
      {/* 状态指示灯 (右上角) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {friend.isOnline ? (
          <span className="relative flex h-3 w-3">
            {/* 呼吸灯动画 */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-3 w-3 bg-gray-400 dark:bg-gray-600" />
        )}
      </div>
      
      <CardContent className={`p-5 ${!friend.isOnline ? 'grayscale-[50%]' : ''}`}>
        <div className="flex items-start gap-4">
          {/* 头像 - 优先使用设置的头像，否则使用网站 Favicon */}
          <Avatar className="w-14 h-14 border-2 border-white dark:border-zinc-700 shadow-sm flex-shrink-0">
            <AvatarImage 
              src={friend.avatarUrl || getFaviconUrl(friend.url)} 
              alt={friend.name}
            />
            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
              {friend.name[0]}
            </AvatarFallback>
          </Avatar>
          
          {/* 信息区 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
              {friend.name}
            </h3>
            {friend.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {friend.description}
              </p>
            )}
            
            {/* 延迟显示 */}
            <div className="mt-2 flex items-center gap-2">
              {friend.isOnline && friend.latencyMs !== null && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 
                  dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                  {friend.latencyMs}ms
                </Badge>
              )}
              {!friend.isOnline && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 
                  dark:bg-zinc-800 dark:text-gray-400 border-gray-200 dark:border-zinc-700">
                  离线
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
