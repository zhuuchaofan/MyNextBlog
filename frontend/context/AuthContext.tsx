'use client'; // 指示这是一个客户端组件，可以使用 React Hooks (useState, useEffect)。

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 定义用户信息的接口
interface User {
  username: string;
  role: string;
  avatarUrl?: string;
  email?: string;
  nickname?: string;
  bio?: string;
  website?: string;
  location?: string;
  occupation?: string;
  birthDate?: string;
}

// 定义 AuthContext 提供的功能和数据接口
interface AuthContextType {
  user: User | null;         // 当前登录用户，未登录为 null
  login: (user: User, redirectTo?: string) => void; // 登录成功后的回调函数，用于更新状态和跳转
  logout: () => Promise<void>; // 登出函数
  updateUser: (user: User) => void; // 手动更新用户状态（例如修改头像后）
  isLoading: boolean;        // 是否正在检查登录状态（用于显示加载动画）
}

// 创建 Context 对象
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件 (AuthProvider)
// 作用：包裹整个应用程序，使所有子组件都能通过 useAuth() 访问登录状态。
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 组件挂载时检查会话状态 (Check Session)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 请求 Next.js 的内部路由 /api/auth/me
        // 这个路由会读取 HttpOnly Cookie 中的 token，并向后端验证。
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // 如果后端验证成功，返回用户信息
          if (data.user) {
             setUser({
                 username: data.user.username,
                 role: data.user.role,
                 avatarUrl: data.user.avatarUrl,
                 email: data.user.email,
                 nickname: data.user.nickname,
                 bio: data.user.bio,
                 website: data.user.website,
                 location: data.user.location,
                 occupation: data.user.occupation,
                 birthDate: data.user.birthDate
             });
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        // 无论成功失败，都标记加载完成
        setIsLoading(false);
      }
    };

    checkSession();
  }, []); // 空依赖数组，只在组件首次挂载时执行一次

  // 登录操作 (仅更新前端状态和跳转)
  // 注意：实际的登录 API 调用发生在 Login 页面组件中，这里只负责接收结果。
  // redirectTo 可选参数：登录后跳转到指定页面，默认跳转到后台首页
  const login = (newUser: User, redirectTo?: string) => {
    setUser(newUser);
    router.push(redirectTo || '/admin'); // 登录后跳转到指定页面或后台首页
  };

  // 登出操作
  const logout = async () => {
    try {
        // 调用 Next.js 的内部路由 /api/auth/logout 清除 HttpOnly Cookie
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null); // 清空前端用户状态
        
        // 使用硬刷新跳转，确保 Server Component 完全重新渲染
        // router.push() + router.refresh() 存在竞争条件，可能不生效
        window.location.href = '/';
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  // 更新用户信息 (例如在设置页修改资料后)
  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook: useAuth
// 作用：方便组件快速获取 AuthContext，不需要每次都 import useContext。
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
