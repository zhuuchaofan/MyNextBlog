'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, User as UserIcon, ArrowRight, PawPrint } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterFormData } from '@/lib/schemas';

export default function RegisterPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setServerError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username, 
          password: formData.password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 注册成功后自动登录
        login({ 
          username: data.user.username, 
          role: data.user.role, 
          avatarUrl: data.user.avatarUrl 
        });
      } else {
        setServerError(data.message || '注册失败，请稍后重试');
      }
    } catch {
      setServerError('连接服务器失败，请稍后再试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-orange-50/50">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-[900px] grid md:grid-cols-2 overflow-hidden shadow-2xl border-0 rounded-3xl z-10 bg-white/80 backdrop-blur-sm m-4">
        
        {/* Left Column: Brand */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-pink-500 to-orange-400 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 text-center space-y-6">
             <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto shadow-lg border border-white/30 animate-float">
                <span className="text-6xl">🚀</span>
             </div>
             <div>
               <h2 className="text-3xl font-bold mb-2">Join Us!</h2>
               <p className="text-orange-100 text-sm">创建账号，开始您的博客之旅</p>
             </div>
          </div>
          
          <PawPrint className="absolute bottom-10 right-10 w-24 h-24 text-white/10 rotate-12" />
          <PawPrint className="absolute top-10 left-10 w-16 h-16 text-white/10 -rotate-12" />
        </div>

        {/* Right Column: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-2xl font-bold text-gray-900">注册账号</h1>
            <p className="text-sm text-gray-500 mt-2">请填写以下信息以完成注册</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                <Input 
                  id="username" 
                  {...register('username')}
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all ${errors.username ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                <Input 
                  id="password" 
                  type="password" 
                  {...register('password')}
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="至少6位"
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  {...register('confirmPassword')}
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="请再次输入密码"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300 mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                 <span className="flex items-center gap-2">
                   <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   注册中...
                 </span>
              ) : <span className="flex items-center gap-2">立即注册 <ArrowRight className="w-4 h-4" /></span>}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">已有账号？ </span>
            <Link href="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-medium">
              去登录
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
