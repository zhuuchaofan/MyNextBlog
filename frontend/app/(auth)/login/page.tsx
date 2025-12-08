'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, User as UserIcon, ArrowRight, PawPrint } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login({ username: data.username, role: data.role });
      } else {
        setError(data.message || '账号或密码错误，请检查');
      }
    } catch (err) {
      setError('连接服务器失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-orange-50/50">
      {/* 背景装饰圆 (Blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-[900px] grid md:grid-cols-2 overflow-hidden shadow-2xl border-0 rounded-3xl z-10 bg-white/80 backdrop-blur-sm m-4">
        
        {/* 左侧：品牌视觉区 */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-orange-400 to-pink-500 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 text-center space-y-6">
             <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-lg border border-white/30 animate-float">
                <span className="text-6xl">🐱</span>
             </div>
             <div>
               <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
               <p className="text-orange-100 text-sm">欢迎回到球球与布丁的后花园</p>
             </div>
             <div className="pt-8 text-xs text-orange-100 opacity-80">
               <p>技术 • 生活 • 萌宠</p>
             </div>
          </div>
          
          {/* 装饰性爪印 */}
          <PawPrint className="absolute bottom-10 right-10 w-24 h-24 text-white/10 rotate-12" />
          <PawPrint className="absolute top-10 left-10 w-16 h-16 text-white/10 -rotate-12" />
        </div>

        {/* 右侧：登录表单 */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-2xl font-bold text-gray-900">管理员登录</h1>
            <p className="text-sm text-gray-500 mt-2">请输入您的凭证以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">用户名</Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                <Input 
                  id="username" 
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all" 
                  placeholder="您的用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end">
                 <Link href="#" className="text-xs text-orange-500 hover:text-orange-600 hover:underline">
                   忘记密码?
                 </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  验证中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  立即登录 <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400">
            &copy; 2025 MyNextBlog. All rights reserved.
          </div>
        </div>
      </Card>
    </div>
  );
}
