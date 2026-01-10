'use client';

import { useState, useEffect, useCallback } from 'react';
import { toggleLike as toggleLikeApi, fetchLikeStatus } from '@/lib/api';
import { toast } from 'sonner';

interface UseLikeOptions {
  /** 是否在挂载时从后端获取真实点赞状态 */
  fetchOnMount?: boolean;
}

interface UseLikeReturn {
  /** 当前是否已点赞 */
  liked: boolean;
  /** 当前点赞数 */
  likeCount: number;
  /** 是否正在加载 */
  loading: boolean;
  /** 点赞/取消点赞处理函数 */
  handleLike: () => Promise<void>;
}

/**
 * 点赞功能的自定义 Hook
 * 
 * 功能：
 * 1. 管理点赞状态（liked, likeCount）
 * 2. 乐观更新 UI，失败时回滚
 * 3. 同步 LocalStorage（作为缓存）
 * 4. 可选从后端获取真实状态
 * 
 * @param postId 文章 ID
 * @param initialLikeCount 初始点赞数
 * @param options 配置选项
 */
export function useLike(
  postId: number,
  initialLikeCount: number,
  options: UseLikeOptions = {}
): UseLikeReturn {
  const { fetchOnMount = true } = options;
  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  // 更新 LocalStorage 缓存（需要在 useEffect 之前定义）
  const updateLocalStorage = useCallback((isLiked: boolean) => {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      let newLikedPosts: number[];
      
      if (isLiked) {
        if (!likedPosts.includes(postId)) {
          newLikedPosts = [...likedPosts, postId];
        } else {
          newLikedPosts = likedPosts;
        }
      } else {
        newLikedPosts = likedPosts.filter((id: number) => id !== postId);
      }
      
      localStorage.setItem('liked_posts', JSON.stringify(newLikedPosts));
    } catch (e) {
      console.error('Failed to update localStorage', e);
    }
  }, [postId]);

  // 初始化：先从 LocalStorage 读取缓存状态，再从后端验证
  useEffect(() => {
    // 1. 先从 LocalStorage 快速恢复状态（避免闪烁）
    try {
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      if (Array.isArray(likedPosts) && likedPosts.includes(postId)) {
        setLiked(true);
      }
    } catch (e) {
      console.error('Failed to parse liked_posts from localStorage', e);
    }

    // 2. 从后端获取真实状态（可选）
    if (fetchOnMount) {
      fetchLikeStatus(postId)
        .then((res) => {
          if (res.success) {
            setLiked(res.isLiked);
            // 更新 LocalStorage 以保持同步
            updateLocalStorage(res.isLiked);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch like status', err);
        });
    }
  }, [postId, fetchOnMount, updateLocalStorage]);

  // 点赞/取消点赞处理
  const handleLike = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    // 保存之前的状态，用于回滚
    const previousLiked = liked;
    const previousCount = likeCount;

    // 乐观更新 UI
    setLiked(!previousLiked);
    setLikeCount((prev) => (previousLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await toggleLikeApi(postId);
      
      if (res.success) {
        // 使用后端返回的准确数据校准
        setLiked(res.isLiked);
        setLikeCount(res.likeCount);
        
        // 更新 LocalStorage
        updateLocalStorage(res.isLiked);
        
        // 显示 Toast 提示（区分点赞和取消）
        if (res.isLiked) {
          toast.success('感谢您的点赞！');
        } else {
          toast.success('已取消点赞');
        }
      } else {
        throw new Error(res.message || '操作失败');
      }
    } catch (error) {
      // 发生错误，回滚 UI
      setLiked(previousLiked);
      setLikeCount(previousCount);
      
      // 显示具体错误信息
      const errorMessage = error instanceof Error ? error.message : '点赞失败，请稍后重试';
      toast.error(errorMessage);
      console.error('Like operation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, liked, likeCount, loading, updateLocalStorage]);

  return { liked, likeCount, loading, handleLike };
}
