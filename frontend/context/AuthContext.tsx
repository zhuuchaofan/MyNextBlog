'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/api';

// 定义用户类型
interface User {
  username: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 初始化时从 LocalStorage 读取状态，并校验 Token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('jwt_token');
      const storedUser = localStorage.getItem('user_info');

      if (storedToken) {
        setToken(storedToken);
        // 先用缓存的用户信息渲染，避免闪烁
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // 后台获取最新信息 (包括最新的头像)
        try {
          const data = await fetchCurrentUser(storedToken);
          // 简单的检查，确保返回了有效的用户数据
          if (data && data.username) {
            const updatedUser: User = { 
              username: data.username, 
              role: data.role,
              avatarUrl: data.avatarUrl
            };
            setUser(updatedUser);
            localStorage.setItem('user_info', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Failed to fetch user profile or session expired:", error);
          // 如果获取失败（例如 401），可以选择登出，或者静默失败保留本地缓存
          // 这里我们选择保留本地缓存，直到用户显式操作或 Token 彻底失效
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));
    router.push('/admin'); 
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    router.push('/');
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user_info', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook，方便在组件里调用 const { user, login } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}