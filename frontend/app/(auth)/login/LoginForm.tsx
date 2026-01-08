'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginFormData } from '@/lib/schemas';
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin'; // 默认跳转到后台
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = async (formData: LoginFormData) => {
    setServerError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login({ 
          username: data.username, 
          role: data.role,
          avatarUrl: data.avatarUrl,
          email: data.email,
          nickname: data.nickname,
          bio: data.bio,
          website: data.website,
          location: data.location,
          occupation: data.occupation,
          birthDate: data.birthDate
        }, redirectTo);
      } else {
        setServerError(data.message || '账号或密码错误，请检查');
      }
    } catch {
      setServerError('连接服务器失败，请稍后再试');
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden bg-white dark:bg-zinc-900">
      
      {/* Left Side: Artistic/Brand Section (Tech Theme) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-10 relative overflow-hidden">
        {/* Tech Background: Dot Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        {/* Subtle Ambient Light */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>

        {/* Brand Content */}
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center text-white">B</div>
          MyNextBlog
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
             <blockquote className="text-xl font-medium leading-relaxed text-zinc-200">
              &ldquo;这个博客平台改变了我记录生活的方式。极简的设计，极致的性能，让写作成为一种享受。&rdquo;
             </blockquote>
           </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
           © 2025 MyNextBlog Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="min-h-screen lg:h-full flex flex-col p-8 bg-zinc-50 dark:bg-zinc-900/50">
        {/* Mobile Brand Header - Static Position to prevent overlap */}
        <div className="lg:hidden flex-none w-full flex items-center gap-2 font-bold text-xl tracking-tighter text-zinc-900 dark:text-white mb-8">
             <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">B</div>
             MyNextBlog
        </div>

        {/* Form Container - Centered */}
        <div className="flex-1 flex items-center justify-center w-full">
            <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[400px] space-y-8"
            >
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">欢迎回来</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                请输入您的凭证以访问管理后台
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {serverError && (
                    <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-md bg-red-50 text-red-500 text-sm border border-red-200"
                    >
                    {serverError}
                    </motion.div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input 
                        id="username"
                        className="pl-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" 
                        placeholder="请输入用户名"
                        {...register('username')}
                    />
                    </div>
                    {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" 
                        placeholder="请输入密码"
                        {...register('password')}
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                        >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600">
                        记住我
                    </label>
                    </div>
                    <Link href="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-500 hover:underline">
                    忘记密码?
                    </Link>
                </div>

                <Button disabled={isSubmitting} className="w-full h-11 bg-black hover:bg-zinc-800 text-white shadow-lg transition-all dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                    {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        验证中...
                    </span>
                    ) : (
                    <span className="flex items-center justify-center gap-2">
                        登录 <ArrowRight className="w-4 h-4" />
                    </span>
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-500">
                    或者
                    </span>
                </div>
            </div>

            <div className="text-center text-sm">
                <span className="text-zinc-500">还没有账号? </span>
                <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 hover:underline">
                立即注册
                </Link>
            </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
